import { getOptionalEnv } from "./env";

export function verifyAgentToolRequest(request: Request): Response | null {
  const expected = getOptionalEnv("AGENT_TOOL_SHARED_SECRET");

  if (!expected) {
    return null;
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${expected}`) {
    return Response.json({ ok: false, error: "Unauthorized agent tool request" }, { status: 401 });
  }

  return null;
}
