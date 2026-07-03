import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  agentToolCalls,
  callEvents,
  callTranscriptMessages,
  calls,
  clientConfigVersions,
  clientIssues,
  clients,
  clientDailyMetrics,
  organizations,
  voiceAgents,
} from "@/db/schema";
import { getOptionalEnv } from "@/lib/server/env";

const SIGNATURE_TOLERANCE_SECONDS = 30 * 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * ElevenLabs signs webhooks with an `elevenlabs-signature` header of the form
 * `t=<unix seconds>,v0=<hmac>` where the HMAC-SHA256 payload is `t.body`.
 */
export function verifyElevenLabsSignature(rawBody: string, signatureHeader: string | null): { ok: true } | { ok: false; reason: string } {
  const secret = getOptionalEnv("ELEVENLABS_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("elevenlabs post-call: ELEVENLABS_WEBHOOK_SECRET is not set; accepting webhook without verification");
    return { ok: true };
  }

  if (!signatureHeader) return { ok: false, reason: "Missing elevenlabs-signature header" };

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const separator = part.indexOf("=");
      return [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v0;
  if (!Number.isFinite(timestamp) || !signature) return { ok: false, reason: "Malformed signature header" };

  const ageSeconds = Math.abs(Date.now() / 1000 - timestamp);
  if (ageSeconds > SIGNATURE_TOLERANCE_SECONDS) return { ok: false, reason: "Signature timestamp outside tolerance" };

  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return { ok: false, reason: "Signature mismatch" };
  }

  return { ok: true };
}

const transcriptEntrySchema = z.object({
  role: z.string().optional(),
  message: z.string().nullable().optional(),
  time_in_call_secs: z.number().nullable().optional(),
}).passthrough();

const postCallPayloadSchema = z.object({
  type: z.string().optional(),
  event_timestamp: z.number().optional(),
  data: z.object({
    agent_id: z.string().optional(),
    conversation_id: z.string().min(1),
    status: z.string().optional(),
    transcript: z.array(transcriptEntrySchema).default([]),
    metadata: z.object({
      start_time_unix_secs: z.number().optional(),
      call_duration_secs: z.number().optional(),
      phone_call: z.record(z.string(), z.unknown()).optional(),
    }).passthrough().optional(),
    analysis: z.object({
      call_successful: z.string().optional(),
      transcript_summary: z.string().optional(),
    }).passthrough().optional(),
    conversation_initiation_client_data: z.object({
      dynamic_variables: z.record(z.string(), z.unknown()).optional(),
    }).passthrough().optional(),
  }).passthrough(),
}).passthrough();

export type PostCallOutcome =
  | { ok: true; callId: string; clientId: string; created: boolean }
  | { ok: false; reason: string };

async function resolveClientId(dynamicVariables: Record<string, unknown> | undefined, agentId: string | undefined) {
  const db = getDb();

  const raw = dynamicVariables?.client_id ?? dynamicVariables?.clientId;
  if (typeof raw === "string" && UUID_PATTERN.test(raw.trim())) {
    const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, raw.trim())).limit(1);
    if (client) return client.id;
  }

  if (agentId) {
    const [agent] = await db
      .select({ clientId: voiceAgents.clientId })
      .from(voiceAgents)
      .where(eq(voiceAgents.externalAgentId, agentId))
      .limit(1);
    if (agent) return agent.clientId;
  }

  return null;
}

async function createUnmatchedAgentIssue(agentId: string | undefined, conversationId: string) {
  const db = getDb();
  const [org] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, "bellory")).limit(1);
  if (!org) return;

  const title = "Post-call webhook from unmatched agent";
  const [existing] = await db
    .select({ id: clientIssues.id })
    .from(clientIssues)
    .where(and(eq(clientIssues.organizationId, org.id), eq(clientIssues.status, "open"), eq(clientIssues.title, title)))
    .limit(1);
  if (existing) return;

  await db.insert(clientIssues).values({
    organizationId: org.id,
    severity: "high",
    status: "open",
    source: "post_call",
    title,
    description: `A post-call webhook arrived for agent ${agentId ?? "unknown"} (conversation ${conversationId}) but no Bellory client matches. Set client_id as a dynamic variable or store the agent id in voice_agents.`,
    actionLabel: "Map the agent",
    metadata: { agentId, conversationId },
  });
}

export async function processPostCallWebhook(rawPayload: unknown): Promise<PostCallOutcome> {
  const parsed = postCallPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return { ok: false, reason: "Payload does not look like an ElevenLabs post-call webhook" };
  }

  const { data } = parsed.data;
  const conversationId = data.conversation_id;
  const dynamicVariables = data.conversation_initiation_client_data?.dynamic_variables;

  const clientId = await resolveClientId(dynamicVariables, data.agent_id);
  if (!clientId) {
    await createUnmatchedAgentIssue(data.agent_id, conversationId);
    return { ok: false, reason: "No Bellory client matches this call" };
  }

  const db = getDb();
  const startedAt = data.metadata?.start_time_unix_secs ? new Date(data.metadata.start_time_unix_secs * 1000) : null;
  const durationSeconds = data.metadata?.call_duration_secs ?? null;
  const endedAt = startedAt && durationSeconds !== null ? new Date(startedAt.getTime() + durationSeconds * 1000) : null;
  const phoneCall = data.metadata?.phone_call;
  const callerPhone = typeof phoneCall?.external_number === "string" ? phoneCall.external_number : null;
  const callFailed = data.status === "failed" || data.analysis?.call_successful === "failure";

  const [voiceAgent] = data.agent_id
    ? await db.select({ id: voiceAgents.id }).from(voiceAgents).where(eq(voiceAgents.externalAgentId, data.agent_id)).limit(1)
    : [];
  const [publishedConfig] = await db
    .select({ id: clientConfigVersions.id })
    .from(clientConfigVersions)
    .where(and(eq(clientConfigVersions.clientId, clientId), eq(clientConfigVersions.status, "published")))
    .orderBy(desc(clientConfigVersions.version))
    .limit(1);

  const callValues = {
    clientId,
    voiceAgentId: voiceAgent?.id ?? null,
    configVersionId: publishedConfig?.id ?? null,
    provider: "elevenlabs",
    externalCallId: conversationId,
    callerPhone,
    status: (callFailed ? "failed" : "completed") as "failed" | "completed",
    startedAt,
    endedAt,
    durationSeconds,
    summary: data.analysis?.transcript_summary ?? null,
    outcome: data.analysis?.call_successful ?? data.status ?? null,
    metadata: {
      agentId: data.agent_id ?? null,
      elevenlabsStatus: data.status ?? null,
      analysis: data.analysis ?? null,
      phoneCall: phoneCall ?? null,
      dynamicVariables: dynamicVariables ?? null,
    },
  };

  const [existing] = await db.select({ id: calls.id }).from(calls).where(eq(calls.externalCallId, conversationId)).limit(1);
  let callId: string;
  const created = !existing;

  if (existing) {
    const [updated] = await db.update(calls).set({ ...callValues, updatedAt: new Date() }).where(eq(calls.id, existing.id)).returning({ id: calls.id });
    callId = updated.id;
  } else {
    const [inserted] = await db.insert(calls).values(callValues).returning({ id: calls.id });
    callId = inserted.id;
  }

  // Replace the transcript so webhook retries stay idempotent.
  await db.delete(callTranscriptMessages).where(eq(callTranscriptMessages.callId, callId));
  const transcriptRows = data.transcript
    .filter((entry) => typeof entry.message === "string" && entry.message.trim().length > 0)
    .map((entry) => ({
      callId,
      speaker: entry.role === "agent" ? "agent" : "caller",
      text: entry.message as string,
      startedAtMs: typeof entry.time_in_call_secs === "number" ? Math.round(entry.time_in_call_secs * 1000) : null,
    }));
  if (transcriptRows.length > 0) {
    await db.insert(callTranscriptMessages).values(transcriptRows);
  }

  await db.insert(callEvents).values({
    callId,
    type: parsed.data.type ?? "post_call_transcription",
    payload: {
      eventTimestamp: parsed.data.event_timestamp ?? null,
      status: data.status ?? null,
      callSuccessful: data.analysis?.call_successful ?? null,
      transcriptMessages: transcriptRows.length,
    },
  });

  // Attach any tool calls the agent made during this conversation.
  await db.update(agentToolCalls)
    .set({ callId })
    .where(and(
      isNull(agentToolCalls.callId),
      sql`(${agentToolCalls.requestPayload}->>'conversation_id' = ${conversationId} or ${agentToolCalls.requestPayload}->>'conversationId' = ${conversationId})`,
    ));

  if (created) {
    const [transferCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentToolCalls)
      .where(and(eq(agentToolCalls.callId, callId), eq(agentToolCalls.toolName, "transfer-request")));
    const urgentHandoffs = Number(transferCount?.count ?? 0) > 0 ? 1 : 0;
    const minutesHandled = durationSeconds ? Math.max(1, Math.ceil(durationSeconds / 60)) : 0;
    const metricDate = (startedAt ?? new Date()).toISOString().slice(0, 10);

    await db
      .insert(clientDailyMetrics)
      .values({ clientId, metricDate, callsAnswered: 1, hoursSavedMinutes: minutesHandled, urgentHandoffs })
      .onConflictDoUpdate({
        target: [clientDailyMetrics.clientId, clientDailyMetrics.metricDate],
        set: {
          callsAnswered: sql`${clientDailyMetrics.callsAnswered} + 1`,
          hoursSavedMinutes: sql`${clientDailyMetrics.hoursSavedMinutes} + ${minutesHandled}`,
          urgentHandoffs: sql`${clientDailyMetrics.urgentHandoffs} + ${urgentHandoffs}`,
          updatedAt: new Date(),
        },
      });
  }

  if (callFailed) {
    const [client] = await db.select({ organizationId: clients.organizationId }).from(clients).where(eq(clients.id, clientId)).limit(1);
    if (client) {
      const title = `Call needs review: ${conversationId}`;
      const [existingIssue] = await db
        .select({ id: clientIssues.id })
        .from(clientIssues)
        .where(and(eq(clientIssues.clientId, clientId), eq(clientIssues.title, title)))
        .limit(1);

      if (!existingIssue) {
        await db.insert(clientIssues).values({
          organizationId: client.organizationId,
          clientId,
          severity: "high",
          status: "open",
          source: "post_call",
          title,
          description: data.analysis?.transcript_summary
            ? `ElevenLabs marked this call unsuccessful. Summary: ${data.analysis.transcript_summary}`.slice(0, 600)
            : "ElevenLabs marked this call unsuccessful. Review the transcript and follow up with the caller if needed.",
          actionLabel: "Review call",
          metadata: { conversationId, callId },
        });
      }
    }
  }

  return { ok: true, callId, clientId, created };
}
