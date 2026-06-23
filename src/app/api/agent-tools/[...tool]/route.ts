import { verifyAgentToolRequest } from "@/lib/server/agent-tool-auth";
import { getStubbedToolResult, readAgentToolPayload, toolResult } from "@/lib/server/agent-tool-responses";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ tool: string[] }> }) {
  const authError = verifyAgentToolRequest(request);
  if (authError) return authError;

  const { tool } = await context.params;
  const toolName = tool.join("/");
  const payload = await readAgentToolPayload(request);

  const result = getStubbedToolResult(toolName, payload);
  return toolResult(result, { status: result.ok ? 200 : 404 });
}
