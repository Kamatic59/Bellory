import { getOptionalEnv, getRequiredEnv } from "@/lib/server/env";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

async function elevenLabs<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T | null }> {
  const response = await fetch(`${ELEVENLABS_BASE}${path}`, {
    ...init,
    headers: {
      "xi-api-key": getRequiredEnv("ELEVENLABS_API_KEY"),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body: body as T | null };
}

type PhoneNumberEntry = { phone_number: string; phone_number_id?: string; id?: string };

/**
 * Imports a Twilio number into ElevenLabs (idempotent) and assigns it to the
 * given agent. Returns the ElevenLabs phone number id.
 */
export async function importAndAssignNumber(
  e164: string,
  label: string,
  agentId: string,
): Promise<{ ok: true; phoneNumberId: string } | { ok: false; error: string }> {
  const sid = getOptionalEnv("TWILIO_ACCOUNT_SID");
  const token = getOptionalEnv("TWILIO_AUTH_TOKEN");
  if (!sid || !token) return { ok: false, error: "Twilio is not configured." };

  const list = await elevenLabs<PhoneNumberEntry[] | { phone_numbers?: PhoneNumberEntry[] }>("/convai/phone-numbers");
  const entries = Array.isArray(list.body) ? list.body : list.body?.phone_numbers ?? [];
  const existing = entries.find((entry) => entry.phone_number === e164);
  let phoneNumberId = existing?.phone_number_id ?? existing?.id ?? null;

  if (!phoneNumberId) {
    const created = await elevenLabs<{ phone_number_id?: string; id?: string; detail?: unknown }>("/convai/phone-numbers/create", {
      method: "POST",
      body: JSON.stringify({ phone_number: e164, label, sid, token }),
    });
    phoneNumberId = created.body?.phone_number_id ?? created.body?.id ?? null;
    if (created.status >= 400 || !phoneNumberId) {
      return { ok: false, error: `Importing the number into ElevenLabs failed (${created.status}): ${JSON.stringify(created.body).slice(0, 200)}` };
    }
  }

  const assigned = await elevenLabs<{ detail?: unknown }>(`/convai/phone-numbers/${phoneNumberId}`, {
    method: "PATCH",
    body: JSON.stringify({ agent_id: agentId }),
  });
  if (assigned.status >= 400) {
    return { ok: false, error: `Assigning the agent failed (${assigned.status}): ${JSON.stringify(assigned.body).slice(0, 200)}` };
  }

  return { ok: true, phoneNumberId };
}
