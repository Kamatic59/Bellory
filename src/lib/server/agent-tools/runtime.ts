import { and, desc, eq, gt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  agentToolCalls,
  calls,
  clientConfigVersions,
  clientDailyMetrics,
  clientIssues,
  clients,
} from "@/db/schema";
import type { BelloryClientConfig } from "@/lib/server/config/client-config-schema";
import { validateClientConfigForPublish } from "@/lib/server/config/config-validation";
import { verifyAgentToolRequest } from "@/lib/server/agent-tool-auth";
import { readAgentToolPayload, toolResult, type AgentToolPayload } from "@/lib/server/agent-tool-responses";

export type AgentToolResult = {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
};

export type AgentToolContext = {
  client: typeof clients.$inferSelect;
  config: BelloryClientConfig;
  configVersionId: string | null;
  callId: string | null;
  conversationId: string | null;
  payload: AgentToolPayload;
};

export type AgentToolHandler = (context: AgentToolContext) => Promise<AgentToolResult>;

const FAILURE_ISSUE_THRESHOLD = 3;
const FAILURE_WINDOW_MINUTES = 15;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Payloads arrive from ElevenLabs webhook tools, which commonly use snake_case
 * dynamic variables. Normalize so handlers can read camelCase keys only.
 */
export function normalizePayload(payload: AgentToolPayload): AgentToolPayload {
  const normalized: AgentToolPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    const camel = key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
    if (!(camel in normalized)) normalized[camel] = value;
    normalized[key] = value;
  }
  return normalized;
}

function stringField(payload: AgentToolPayload, key: string): string | null {
  const value = payload[key];
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

type ClientResolution =
  | { ok: true; client: typeof clients.$inferSelect; config: BelloryClientConfig; configVersionId: string | null }
  | { ok: false; clientId: string | null; result: AgentToolResult };

/**
 * Loads the client and its runtime config. Published config is preferred; a
 * draft that passes full publish validation is accepted so test agents can run
 * before the first publish. Anything else is refused so live calls never run
 * on incomplete rules.
 */
async function resolveClient(payload: AgentToolPayload): Promise<ClientResolution> {
  const clientId = stringField(payload, "clientId");

  if (!clientId || !UUID_PATTERN.test(clientId)) {
    return {
      ok: false,
      clientId,
      result: {
        ok: false,
        message: "This tool needs the client_id dynamic variable. Continue the call politely and collect callback details for the team.",
      },
    };
  }

  const db = getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) {
    return {
      ok: false,
      clientId,
      result: {
        ok: false,
        message: "No business matches this client_id. Continue the call politely and collect callback details for the team.",
      },
    };
  }

  const versions = await db
    .select()
    .from(clientConfigVersions)
    .where(eq(clientConfigVersions.clientId, clientId))
    .orderBy(desc(clientConfigVersions.version));

  const published = versions.find((version) => version.status === "published");
  const candidate = published ?? versions.find((version) => version.status === "draft") ?? versions[0];
  const validation = candidate ? validateClientConfigForPublish(candidate.config) : null;

  if (!candidate || !validation || !validation.ok) {
    return {
      ok: false,
      clientId,
      result: {
        ok: false,
        message: "This business's setup is not complete yet. Take the caller's name, phone number, and issue, and say the team will follow up shortly.",
      },
    };
  }

  return { ok: true, client, config: validation.config, configVersionId: candidate.id };
}

async function findCallId(conversationId: string | null): Promise<string | null> {
  if (!conversationId) return null;
  const db = getDb();
  const [call] = await db.select({ id: calls.id }).from(calls).where(eq(calls.externalCallId, conversationId)).limit(1);
  return call?.id ?? null;
}

async function recordToolFailureSignals(clientId: string, organizationId: string, toolName: string) {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  await db
    .insert(clientDailyMetrics)
    .values({ clientId, metricDate: today, toolFailures: 1 })
    .onConflictDoUpdate({
      target: [clientDailyMetrics.clientId, clientDailyMetrics.metricDate],
      set: { toolFailures: sql`${clientDailyMetrics.toolFailures} + 1`, updatedAt: new Date() },
    });

  const windowStart = new Date(Date.now() - FAILURE_WINDOW_MINUTES * 60_000);
  const [recentFailures] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(agentToolCalls)
    .where(and(
      eq(agentToolCalls.clientId, clientId),
      eq(agentToolCalls.toolName, toolName),
      ne(agentToolCalls.status, "success"),
      gt(agentToolCalls.createdAt, windowStart),
    ));

  if (Number(recentFailures?.count ?? 0) + 1 < FAILURE_ISSUE_THRESHOLD) return;

  const issueTitle = `Agent tool failing: ${toolName}`;
  const [existing] = await db
    .select({ id: clientIssues.id })
    .from(clientIssues)
    .where(and(
      eq(clientIssues.clientId, clientId),
      eq(clientIssues.source, "agent_tools"),
      eq(clientIssues.status, "open"),
      eq(clientIssues.title, issueTitle),
    ))
    .limit(1);
  if (existing) return;

  await db.insert(clientIssues).values({
    organizationId,
    clientId,
    severity: "high",
    status: "open",
    source: "agent_tools",
    title: issueTitle,
    description: `The ${toolName} tool failed ${FAILURE_ISSUE_THRESHOLD}+ times in the last ${FAILURE_WINDOW_MINUTES} minutes. Live callers may be getting degraded answers.`,
    actionLabel: "Review tool calls",
    metadata: { toolName },
  });
}

async function logToolCall(entry: {
  clientId: string | null;
  organizationId: string | null;
  callId: string | null;
  toolName: string;
  requestPayload: AgentToolPayload;
  result: AgentToolResult;
  status: "success" | "failed" | "error";
  latencyMs: number;
}) {
  try {
    const db = getDb();
    await db.insert(agentToolCalls).values({
      clientId: entry.clientId,
      callId: entry.callId,
      toolName: entry.toolName,
      requestPayload: entry.requestPayload,
      responsePayload: { ok: entry.result.ok, message: entry.result.message, data: entry.result.data ?? null },
      status: entry.status,
      latencyMs: entry.latencyMs,
    });

    if (entry.status !== "success" && entry.clientId && entry.organizationId) {
      await recordToolFailureSignals(entry.clientId, entry.organizationId, entry.toolName);
    }
  } catch (error) {
    console.error("agent-tools: failed to log tool call", error);
  }
}

export async function executeAgentTool(
  request: Request,
  toolName: string,
  handlers: Record<string, AgentToolHandler>,
): Promise<Response> {
  const authError = verifyAgentToolRequest(request);
  if (authError) return authError;

  const rawPayload = await readAgentToolPayload(request);
  const payload = normalizePayload(rawPayload);
  const startedAt = Date.now();

  const handler = handlers[toolName];
  if (!handler) {
    const result: AgentToolResult = { ok: false, message: `Unknown Bellory agent tool: ${toolName}` };
    await logToolCall({
      clientId: stringField(payload, "clientId"),
      organizationId: null,
      callId: null,
      toolName,
      requestPayload: rawPayload,
      result,
      status: "error",
      latencyMs: Date.now() - startedAt,
    });
    return toolResult(result, { status: 404 });
  }

  const resolution = await resolveClient(payload);
  if (!resolution.ok) {
    await logToolCall({
      clientId: resolution.clientId && UUID_PATTERN.test(resolution.clientId) ? resolution.clientId : null,
      organizationId: null,
      callId: null,
      toolName,
      requestPayload: rawPayload,
      result: resolution.result,
      status: "failed",
      latencyMs: Date.now() - startedAt,
    });
    return toolResult(resolution.result, { status: 200 });
  }

  const conversationId = stringField(payload, "conversationId");
  const callId = await findCallId(conversationId);

  const context: AgentToolContext = {
    client: resolution.client,
    config: resolution.config,
    configVersionId: resolution.configVersionId,
    callId,
    conversationId,
    payload,
  };

  let result: AgentToolResult;
  let status: "success" | "failed" | "error";
  try {
    result = await handler(context);
    status = result.ok ? "success" : "failed";
  } catch (error) {
    console.error(`agent-tools: ${toolName} handler crashed`, error);
    result = {
      ok: false,
      message: "This lookup is not responding right now. Continue the call, collect the caller's details, and say the team will confirm shortly.",
    };
    status = "error";
  }

  await logToolCall({
    clientId: resolution.client.id,
    organizationId: resolution.client.organizationId,
    callId,
    toolName,
    requestPayload: rawPayload,
    result,
    status,
    latencyMs: Date.now() - startedAt,
  });

  return toolResult(result, { status: 200 });
}
