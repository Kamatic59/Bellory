export type AgentToolPayload = Record<string, unknown>;

type AgentToolResult = {
  ok: boolean;
  message: string;
  data?: Record<string, unknown> | null;
};

export async function readAgentToolPayload(request: Request): Promise<AgentToolPayload> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body as AgentToolPayload : {};
  } catch {
    return {};
  }
}

export function toolResult(result: AgentToolResult, init?: ResponseInit) {
  return Response.json(result, init);
}
