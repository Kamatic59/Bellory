import { agentToolHandlers } from "@/lib/server/agent-tools/handlers";
import { executeAgentTool } from "@/lib/server/agent-tools/runtime";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ tool: string[] }> }) {
  const { tool } = await context.params;
  return executeAgentTool(request, tool.join("/"), agentToolHandlers);
}
