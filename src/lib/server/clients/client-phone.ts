import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, phoneNumbers, voiceAgents } from "@/db/schema";
import { saveClientConfigDraft } from "@/lib/server/clients/client-config-store";
import { importAndAssignNumber } from "@/lib/server/elevenlabs/phone-numbers";
import { listOwnedNumbers, purchaseNumber, twilioConfigured } from "@/lib/server/twilio/phone-numbers";

export async function getClientPhoneState(clientId: string) {
  const db = getDb();
  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) return null;

  const rows = await db
    .select({ e164: phoneNumbers.e164, status: phoneNumbers.status, updatedAt: phoneNumbers.updatedAt })
    .from(phoneNumbers)
    .where(eq(phoneNumbers.clientId, clientId))
    .orderBy(desc(phoneNumbers.updatedAt));
  // A freshly retired number can have a newer timestamp than the live one, so
  // connected rows always win over disabled/disconnected history.
  const current = rows.find((row) => row.status === "connected") ?? rows[0];

  const assigned = await db.select({ e164: phoneNumbers.e164 }).from(phoneNumbers);
  const assignedSet = new Set(assigned.map((row) => row.e164));

  const owned = await listOwnedNumbers();
  const available = owned.ok
    ? owned.numbers.filter((number) => number.voice && !assignedSet.has(number.phoneNumber))
    : [];

  return {
    configured: twilioConfigured(),
    current: current ?? null,
    ownedUnassigned: available,
    ownedError: owned.ok ? null : owned.error,
  };
}

export async function connectClientPhoneNumber(
  clientId: string,
  phoneNumber: string,
  options: { purchase?: boolean } = {},
): Promise<{ ok: true; e164: string } | { ok: false; error: string }> {
  if (!/^\+1\d{10}$/.test(phoneNumber)) {
    return { ok: false, error: "Phone number must be E.164 format, e.g. +18015550100." };
  }

  const db = getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) return { ok: false, error: "Client not found." };

  const [agent] = await db
    .select()
    .from(voiceAgents)
    .where(and(eq(voiceAgents.clientId, clientId), eq(voiceAgents.provider, "elevenlabs")))
    .orderBy(desc(voiceAgents.createdAt))
    .limit(1);
  if (!agent?.externalAgentId) {
    return { ok: false, error: "Sync the ElevenLabs agent first (Agent & Prompt tab), then connect a number." };
  }

  if (options.purchase) {
    const purchased = await purchaseNumber(phoneNumber);
    if (!purchased.ok) return purchased;
  } else {
    const owned = await listOwnedNumbers();
    if (!owned.ok) return owned;
    if (!owned.numbers.some((number) => number.phoneNumber === phoneNumber)) {
      return { ok: false, error: "That number is not in the Twilio account. Buy it first or pick an owned number." };
    }
  }

  const imported = await importAndAssignNumber(phoneNumber, `${client.name} — Bellory`, agent.externalAgentId);
  if (!imported.ok) return imported;

  const [existing] = await db.select({ id: phoneNumbers.id }).from(phoneNumbers).where(eq(phoneNumbers.e164, phoneNumber)).limit(1);
  const values = {
    clientId,
    voiceAgentId: agent.id,
    provider: "twilio",
    externalNumberId: imported.phoneNumberId,
    status: "connected" as const,
  };
  if (existing) {
    await db.update(phoneNumbers).set({ ...values, updatedAt: new Date() }).where(eq(phoneNumbers.id, existing.id));
  } else {
    await db.insert(phoneNumbers).values({ e164: phoneNumber, ...values });
  }

  await saveClientConfigDraft(clientId, {
    phoneRouting: { belloryNumber: phoneNumber },
    integrations: { twilio: { status: "connected", provider: "twilio", phoneNumberId: imported.phoneNumberId } },
  });

  return { ok: true, e164: phoneNumber };
}
