import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clientConfigVersions, clients, voiceAgents } from "@/db/schema";
import type { BelloryClientConfig } from "@/lib/server/config/client-config-schema";
import { validateClientConfigForPublish } from "@/lib/server/config/config-validation";
import { buildKnowledgeBaseDocument } from "@/lib/server/config/knowledge-base-builder";
import { saveClientConfigDraft } from "@/lib/server/clients/client-config-store";
import { getOptionalEnv, getRequiredEnv } from "@/lib/server/env";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

export type AgentSyncResult =
  | { ok: true; agentId: string; createdAgent: boolean; toolIds: Record<string, string>; message: string }
  | { ok: false; error: string };

type JsonProperty = {
  type: "string" | "boolean" | "integer" | "number";
  description?: string;
  dynamic_variable?: string;
  constant_value?: string;
};

type WebhookToolConfig = {
  type: "webhook";
  name: string;
  description: string;
  response_timeout_secs: number;
  api_schema: {
    url: string;
    method: "POST";
    request_headers: Record<string, string>;
    request_body_schema: {
      type: "object";
      required: string[];
      description: string;
      properties: Record<string, JsonProperty>;
    };
  };
};

async function elevenLabs<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T | null }> {
  const apiKey = getRequiredEnv("ELEVENLABS_API_KEY");
  const response = await fetch(`${ELEVENLABS_BASE}${path}`, {
    ...init,
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body: body as T | null };
}

function buildToolDefinitions(clientId: string, baseUrl: string): WebhookToolConfig[] {
  const secret = getOptionalEnv("AGENT_TOOL_SHARED_SECRET");
  const headers: Record<string, string> = secret ? { Authorization: `Bearer ${secret}` } : {};

  // Each client gets its own tool records with client_id baked in as a
  // constant: agent-level dynamic-variable placeholders are not applied to
  // real phone calls, and ElevenLabs drops calls whose tools reference
  // undefined variables. conversation_id is a system variable, always set.
  const constants: Record<string, JsonProperty> = {
    client_id: { type: "string", constant_value: clientId },
    conversation_id: { type: "string", dynamic_variable: "system__conversation_id" },
  };

  function tool(
    name: string,
    endpoint: string,
    description: string,
    bodyDescription: string,
    properties: Record<string, JsonProperty>,
    required: string[] = [],
  ): WebhookToolConfig {
    return {
      type: "webhook",
      name,
      description,
      response_timeout_secs: 20,
      api_schema: {
        url: `${baseUrl}/api/agent-tools/${endpoint}`,
        method: "POST",
        request_headers: headers,
        request_body_schema: {
          type: "object",
          required,
          description: bodyDescription,
          properties: { ...constants, ...properties },
        },
      },
    };
  }

  return [
    tool(
      "bellory_get_client_context",
      "client-context",
      "Load this business's live rules: hours, services, pricing guardrails, service areas, booking mode, intake fields, and urgent triggers. Call this once near the start of the call before answering business questions.",
      "No caller input needed.",
      {},
    ),
    tool(
      "bellory_check_service_area",
      "service-area",
      "Check whether the caller's location is inside this business's service area. Call before promising service or booking. Provide the caller's city, ZIP code, or both.",
      "The caller's location.",
      {
        city: { type: "string", description: "Caller's city, e.g. 'Salt Lake City'." },
        zip: { type: "string", description: "Caller's 5-digit ZIP code, if given." },
      },
    ),
    tool(
      "bellory_classify_urgency",
      "classify-urgency",
      "Classify how urgent the caller's issue is using this business's urgency rules. Call once the caller has described their problem.",
      "The caller's issue.",
      {
        issue: { type: "string", description: "Short description of the caller's problem in their own words." },
        vehicle_trapped: { type: "boolean", description: "True if a vehicle or person is trapped." },
        after_hours: { type: "boolean", description: "True if the call is outside normal business hours." },
      },
      ["issue"],
    ),
    tool(
      "bellory_check_availability",
      "calendar/availability",
      "Get real bookable openings for this business. Always call this before offering any appointment time. Never invent availability.",
      "Optional preferences.",
      {
        preferred_date: { type: "string", description: "Caller's preferred date in YYYY-MM-DD format, if they mentioned one." },
        appointment_type: { type: "string", description: "Type of appointment, e.g. 'service call' or 'estimate'." },
      },
    ),
    tool(
      "bellory_book_appointment",
      "calendar/book",
      "Book or request an appointment at a specific time. Only use a starts_at value returned by bellory_check_availability. You must collect the caller's name, callback phone number, and the full service address before booking — the technician needs to know where to go. Ask for email only if the caller prefers email contact.",
      "The chosen slot, caller contact details, and the job.",
      {
        starts_at: { type: "string", description: "Exact startsAt ISO timestamp of the chosen slot from bellory_check_availability." },
        caller_name: { type: "string", description: "Caller's full name." },
        caller_phone: { type: "string", description: "Caller's callback phone number." },
        address: { type: "string", description: "Full service address where the work happens, including street and city." },
        email: { type: "string", description: "Caller's email address, only if they gave one or prefer email." },
        urgency: { type: "string", description: "low, medium, or high." },
        service_summary: { type: "string", description: "One line describing the work needed." },
      },
      ["starts_at", "caller_name", "caller_phone", "address"],
    ),
    tool(
      "bellory_find_appointments",
      "appointments/lookup",
      "Find a caller's upcoming appointments by the phone number they booked under. Use this first whenever a caller wants to change, cancel, or ask about an existing appointment.",
      "The caller's phone number.",
      {
        phone: { type: "string", description: "The phone number the appointment was booked under." },
      },
      ["phone"],
    ),
    tool(
      "bellory_reschedule_appointment",
      "appointments/reschedule",
      "Move an existing appointment to a new time. First find it with bellory_find_appointments and confirm the name matches the caller, then get an open slot with bellory_check_availability, then call this.",
      "The appointment and its new time.",
      {
        appointment_id: { type: "string", description: "appointmentId from bellory_find_appointments." },
        new_starts_at: { type: "string", description: "The new slot's exact startsAt ISO timestamp from bellory_check_availability." },
      },
      ["appointment_id", "new_starts_at"],
    ),
    tool(
      "bellory_cancel_appointment",
      "appointments/cancel",
      "Cancel an existing appointment. First find it with bellory_find_appointments, confirm the name matches, and confirm the caller really wants to cancel before calling this.",
      "The appointment to cancel.",
      {
        appointment_id: { type: "string", description: "appointmentId from bellory_find_appointments." },
        reason: { type: "string", description: "Brief reason the caller gave, if any." },
      },
      ["appointment_id"],
    ),
    tool(
      "bellory_save_lead",
      "leads/upsert",
      "Save or update the caller as a lead with their details and issue. Call before the call ends for every real caller, even when nothing was booked.",
      "The caller's details.",
      {
        phone: { type: "string", description: "Caller's callback phone number." },
        name: { type: "string", description: "Caller's name." },
        address: { type: "string", description: "Service address, if the caller shared it." },
        email: { type: "string", description: "Caller's email, if they gave one." },
        issue: { type: "string", description: "Short description of the caller's problem." },
        urgency: { type: "string", description: "low, medium, or high." },
        summary: { type: "string", description: "One or two sentences summarizing the call and next step." },
        appointment_id: { type: "string", description: "appointmentId returned by bellory_book_appointment, if an appointment was made." },
      },
      ["phone"],
    ),
    tool(
      "bellory_send_owner_alert",
      "owner-alert",
      "Notify the business owner about an urgent situation or a caller who needs fast follow-up. Use for urgent issues that cannot be fully handled on this call.",
      "The alert details.",
      {
        reason: { type: "string", description: "Why the owner needs to know, in one sentence." },
        issue: { type: "string", description: "The caller's issue." },
        caller_phone: { type: "string", description: "Caller's callback phone number." },
        urgency: { type: "string", description: "low, medium, or high." },
      },
      ["reason"],
    ),
    tool(
      "bellory_request_transfer",
      "transfer-request",
      "Check whether transferring this caller to a person is allowed and get the transfer contact. Use when the caller asks for a human or the situation needs one.",
      "The transfer context.",
      {
        reason: { type: "string", description: "Why the caller should be transferred." },
        urgency: { type: "string", description: "low, medium, or high." },
      },
    ),
  ];
}

const SPEECH_STYLE_SECTION = `

# Speech Style — sound like a person on the phone
- Keep turns short: one or two sentences, then let the caller talk.
- Use contractions and everyday words. Say "I'll get that set up" not "I will proceed to schedule that".
- Vary your acknowledgments: "Got it." "Okay." "Sure." "Perfect." Never use the same one twice in a row.
- When a lookup takes a moment, a short line like "One sec, let me check that for you" is good — but it must happen in the SAME turn as the tool call. Never end your turn on a promise to look something up; that leaves the caller in dead air.
- Say times and numbers like a person: "eight tomorrow morning", not "eight zero zero AM". Read phone numbers back in groups of three and four.
- If the caller sounds stressed, acknowledge it once, briefly and sincerely, then help: "Oh no — okay, let's get someone out to you."
- If the caller interrupts, stop immediately and respond to what they said.
- Never recite lists. Offer one option, and only mention another if the first does not work.
- Do not repeat the caller's words back verbatim, do not over-apologize, and never announce what you are doing internally.
- One question at a time, always.

# Warmth — you are a friendly local, not a corporate rep
You are the voice of a small local business, and callers should feel like they reached a real person who cares. When earlier tone guidance says "professional" or "polished", warmth wins.
- React like a person first, then help. "Oh no — your car's stuck in there? Okay, let's get you taken care of." Never "I understand. That makes it a high priority."
- These words are banned; they make you sound like a call center: "typically", "primarily", "however", "I understand", "assist", "at this time", "high priority", "proceed".
- Say prices the way a neighbor would: "Springs usually run somewhere between two eighty-five and four fifty, depending on the door." Not "A spring replacement typically ranges from...".
- Confirm plans casually: "Sound good?" or "That work for you?" — never "Would you like me to do that?"
- Once you have the caller's name, use it once or twice where it feels natural. Not every sentence.
- One brief human aside is welcome when it fits — "Stuck car... that's the worst." — then get back to helping.
- Offer help like you mean it: "let's get someone out to you", "I'll grab your info", "we'll take care of it".

# Natural Imperfection
Real receptionists are not perfectly fluent. Written punctuation controls your voice: ellipses make you pause, a dash makes you stop short. Use that.
- Sparingly — at most once every few turns — open a thinking moment with a soft filler: "Um, let me see..." or "Hmm, one sec..."
- Use ellipses for a small pause mid-thought: "We've got... Monday at eight in the morning — would that work?"
- Very occasionally self-correct like a person: "That'd be Tues— actually, Monday morning is the earliest."
- Vary your pace: a short beat before answering a question feels human; instant perfect answers feel robotic.
- Never use fillers or pauses when reading back names, phone numbers, times, or addresses — say those cleanly and clearly.
- Most turns should still be clean. If every sentence hesitates, it sounds fake.`;

const TOOL_PROMPT_SECTION = `

# Your Tools
Use these tools instead of guessing. Never mention tool names to callers.
- bellory_get_client_context: call once near the start of the call to load business rules.
- bellory_check_service_area: before promising service or booking, check the caller's city or ZIP.
- bellory_classify_urgency: after the caller describes their problem.
- bellory_check_availability: always call before offering any time. Never invent availability.
- bellory_book_appointment: only with a starts_at value from bellory_check_availability, and only after you have the caller's name, phone number, and full service address. Ask for these naturally, one at a time, before offering to lock in the time.
- bellory_find_appointments: when a caller asks about an existing appointment, look it up by their phone number.
- bellory_reschedule_appointment / bellory_cancel_appointment: after finding the appointment and confirming the name matches.
- bellory_save_lead: before ending every real call, save the caller's details.
- bellory_send_owner_alert: for urgent situations the owner must hear about quickly.
- bellory_request_transfer: when the caller needs a person.
Each tool response includes a message with instructions. Follow it.

Tool discipline:
- If you say you are checking, pulling up, or looking into anything, call the matching tool in that same turn. Announcing a lookup and then going silent is the worst thing you can do on a phone call.
- The moment a caller asks about pricing, hours, services, or coverage and you have not called bellory_get_client_context yet this call, call it right then and answer from the result.
- A short "let me check that" filler is only natural before genuinely slow lookups — checking availability or finding an existing appointment. For anything else (pricing, hours, services, saving a lead, sending an alert), just answer or act directly; do not announce it.
- You get the tool result back in the same turn, every time. Say your filler line and give the answer in ONE turn. Never spread a single lookup across multiple turns.
- These phrases are banned — they create dead air: "still loading", "still waiting", "it's taking a moment", "still pulling that up", "bear with me", "just a little longer". Say your one filler line, then the answer. Never a second waiting line.
- Never ask "are you still there?" after your own lookup — the caller is waiting on you, not the other way around.
- If a tool genuinely returns nothing useful, do not keep waiting or apologize for the delay. Move on immediately: take the caller's details and tell them the team will follow up.

# Changing or Cancelling an Existing Appointment
You can look up, reschedule, and cancel appointments yourself:
1. Ask for the phone number the appointment was booked under, then call bellory_find_appointments.
2. Before changing anything, confirm the name on the appointment matches the caller ("Can I confirm the name on that appointment?").
3. To reschedule: ask what day works, call bellory_check_availability, offer one slot, then bellory_reschedule_appointment with the appointment_id and the new slot's startsAt. Confirm the new time back to the caller.
4. To cancel: confirm once ("Just to be sure — cancel the Monday morning repair?"), then bellory_cancel_appointment. Offer to book a new time whenever they're ready.
5. If nothing is found under their number, double-check the number once; if still nothing, take their details with bellory_save_lead and send bellory_send_owner_alert so the team follows up. Never claim a change happened unless the tool confirmed it.

# Do Not Loop
If you have refused the same request or given the same answer twice, do not repeat it a third time. Move the call forward: offer to take a message for the owner, or politely wrap up. Say something like "I've got that noted and I'll make sure the team follows up — is there anything else I can help you with?" Endless repetition frustrates callers more than a clear no.`;

type ToolResponse = { id?: string };
type AgentResponse = { agent_id?: string };

/**
 * Tools are per-client (client_id is a constant in each), so matching uses the
 * tool ids stored on the client's voice_agents row from the previous sync —
 * never workspace-wide name matching.
 */
async function upsertTools(definitions: WebhookToolConfig[], storedToolIds: Record<string, string>): Promise<Record<string, string>> {
  const toolIds: Record<string, string> = {};

  for (const definition of definitions) {
    const existingId = storedToolIds[definition.name];

    if (existingId) {
      const updated = await elevenLabs<ToolResponse>(`/convai/tools/${existingId}`, {
        method: "PATCH",
        body: JSON.stringify({ tool_config: definition }),
      });
      if (updated.status < 400) {
        toolIds[definition.name] = existingId;
        continue;
      }
      if (updated.status !== 404) {
        throw new Error(`Updating tool ${definition.name} failed (${updated.status}): ${JSON.stringify(updated.body).slice(0, 300)}`);
      }
      // 404: the tool was deleted remotely — fall through and recreate it.
    }

    const created = await elevenLabs<ToolResponse>("/convai/tools", {
      method: "POST",
      body: JSON.stringify({ tool_config: definition }),
    });
    if (created.status >= 400 || !created.body?.id) {
      throw new Error(`Creating tool ${definition.name} failed (${created.status}): ${JSON.stringify(created.body).slice(0, 300)}`);
    }
    toolIds[definition.name] = created.body.id;
  }

  return toolIds;
}

type KnowledgeBaseRef = { id: string; name: string } | null;

/** Uploads the generated KB document as an ElevenLabs text document. */
async function uploadKnowledgeBase(config: BelloryClientConfig): Promise<KnowledgeBaseRef> {
  const name = `Bellory KB — ${config.businessIdentity.publicName}`;
  const text = buildKnowledgeBaseDocument(config, { clientName: config.businessIdentity.publicName });

  const created = await elevenLabs<{ id?: string }>("/convai/knowledge-base/text", {
    method: "POST",
    body: JSON.stringify({ name, text }),
  });
  if (created.status >= 400 || !created.body?.id) {
    console.error("elevenlabs sync: knowledge base upload failed", created.status, JSON.stringify(created.body).slice(0, 200));
    return null;
  }
  return { id: created.body.id, name };
}

async function deleteKnowledgeBaseDoc(id: string) {
  const deleted = await elevenLabs(`/convai/knowledge-base/${id}`, { method: "DELETE" });
  if (deleted.status >= 400) {
    console.warn("elevenlabs sync: could not delete old knowledge base doc", id, deleted.status);
  }
}

function buildAgentBody(clientId: string, config: BelloryClientConfig, toolIds: string[], knowledgeBase: KnowledgeBaseRef) {
  const voiceId = config.aiVoice.externalVoiceId
    || getOptionalEnv("ELEVENLABS_DEMO_VOICE_ID")
    || getOptionalEnv("ELEVENLABS_DEFAULT_VOICE_ID");

  return {
    name: config.aiVoice.agentDisplayName,
    conversation_config: {
      agent: {
        first_message: config.aiVoice.greetingScript,
        language: "en",
        prompt: {
          prompt: `${config.aiVoice.systemPrompt}${SPEECH_STYLE_SECTION}${TOOL_PROMPT_SECTION}`,
          llm: "gemini-2.5-flash",
          tool_ids: toolIds,
          ...(knowledgeBase ? { knowledge_base: [{ type: "text", id: knowledgeBase.id, name: knowledgeBase.name }] } : {}),
        },
        dynamic_variables: {
          dynamic_variable_placeholders: {
            client_id: clientId,
            business_name: config.businessIdentity.publicName,
          },
        },
      },
      ...(voiceId
        ? {
          tts: {
            voice_id: voiceId,
            // Turbo trades a little latency for noticeably more natural
            // delivery; lower stability lets intonation vary like a person.
            // English agents require the v2 models (v2_5 is multilingual-only).
            model_id: "eleven_turbo_v2",
            stability: 0.4,
            similarity_boost: 0.85,
            speed: 0.97,
          },
        }
        : {}),
    },
  };
}

export async function syncClientAgent(clientId: string): Promise<AgentSyncResult> {
  if (!getOptionalEnv("ELEVENLABS_API_KEY")) {
    return { ok: false, error: "ELEVENLABS_API_KEY is not configured." };
  }

  const db = getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) return { ok: false, error: "Client not found." };

  const versions = await db
    .select()
    .from(clientConfigVersions)
    .where(eq(clientConfigVersions.clientId, clientId))
    .orderBy(desc(clientConfigVersions.version));
  const candidate = versions.find((version) => version.status === "published")
    ?? versions.find((version) => version.status === "draft")
    ?? versions[0];
  const validation = candidate ? validateClientConfigForPublish(candidate.config) : null;
  if (!candidate || !validation || !validation.ok) {
    return { ok: false, error: "The client config is not complete enough to sync. Fix validation issues first." };
  }
  const config = validation.config;

  // Tool URLs must be reachable from ElevenLabs, so a localhost app URL can be
  // overridden with AGENT_TOOLS_BASE_URL (e.g. the production deployment).
  const baseUrl = (getOptionalEnv("AGENT_TOOLS_BASE_URL") ?? getRequiredEnv("NEXT_PUBLIC_APP_URL")).replace(/\/$/, "");
  if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
    return { ok: false, error: "Agent tools must use a public URL. Set AGENT_TOOLS_BASE_URL to the deployed app URL before syncing." };
  }

  const [existingAgentRow] = await db
    .select()
    .from(voiceAgents)
    .where(and(eq(voiceAgents.clientId, clientId), eq(voiceAgents.provider, "elevenlabs")))
    .orderBy(desc(voiceAgents.createdAt))
    .limit(1);

  const agentMetadata = existingAgentRow?.metadata as { toolIds?: Record<string, string>; knowledgeBaseId?: string } | undefined;
  const storedToolIds = agentMetadata?.toolIds ?? {};
  const toolIds = await upsertTools(buildToolDefinitions(clientId, baseUrl), storedToolIds);
  const knowledgeBase = await uploadKnowledgeBase(config);
  const agentBody = buildAgentBody(clientId, config, Object.values(toolIds), knowledgeBase);

  const knownAgentId = config.aiVoice.externalAgentId || existingAgentRow?.externalAgentId || null;
  let agentId = knownAgentId;
  let createdAgent = false;

  if (knownAgentId) {
    const updated = await elevenLabs<AgentResponse>(`/convai/agents/${knownAgentId}`, {
      method: "PATCH",
      body: JSON.stringify(agentBody),
    });
    if (updated.status === 404) {
      agentId = null;
    } else if (updated.status >= 400) {
      return { ok: false, error: `Updating agent failed (${updated.status}): ${JSON.stringify(updated.body).slice(0, 300)}` };
    }
  }

  if (!agentId) {
    const created = await elevenLabs<AgentResponse>("/convai/agents/create", {
      method: "POST",
      body: JSON.stringify(agentBody),
    });
    if (created.status >= 400 || !created.body?.agent_id) {
      return { ok: false, error: `Creating agent failed (${created.status}): ${JSON.stringify(created.body).slice(0, 300)}` };
    }
    agentId = created.body.agent_id;
    createdAgent = true;
  }

  // The agent now references the fresh KB doc, so the previous one can go.
  if (agentMetadata?.knowledgeBaseId && knowledgeBase && agentMetadata.knowledgeBaseId !== knowledgeBase.id) {
    await deleteKnowledgeBaseDoc(agentMetadata.knowledgeBaseId);
  }

  const agentRowValues = {
    provider: "elevenlabs",
    externalAgentId: agentId,
    externalVoiceId: config.aiVoice.externalVoiceId || null,
    displayName: config.aiVoice.agentDisplayName,
    status: "connected" as const,
    metadata: {
      toolIds,
      knowledgeBaseId: knowledgeBase?.id ?? agentMetadata?.knowledgeBaseId ?? null,
      syncedAt: new Date().toISOString(),
      configVersionId: candidate.id,
    },
  };

  if (existingAgentRow) {
    await db.update(voiceAgents).set({ ...agentRowValues, updatedAt: new Date() }).where(eq(voiceAgents.id, existingAgentRow.id));
  } else {
    await db.insert(voiceAgents).values({ clientId, ...agentRowValues });
  }

  await saveClientConfigDraft(clientId, {
    aiVoice: { externalAgentId: agentId },
    integrations: { elevenLabs: { status: "connected", provider: "elevenlabs", externalAgentId: agentId } },
  });

  return {
    ok: true,
    agentId,
    createdAgent,
    toolIds,
    message: createdAgent
      ? `Created ElevenLabs agent ${agentId} with ${Object.keys(toolIds).length} webhook tools.`
      : `Updated ElevenLabs agent ${agentId} with ${Object.keys(toolIds).length} webhook tools.`,
  };
}
