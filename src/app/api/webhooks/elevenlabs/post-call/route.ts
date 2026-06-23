import { verifyAgentToolRequest } from "@/lib/server/agent-tool-auth";
import { readAgentToolPayload } from "@/lib/server/agent-tool-responses";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = verifyAgentToolRequest(request);
  if (authError) return authError;

  const payload = await readAgentToolPayload(request);

  return Response.json({
    ok: true,
    message: "ElevenLabs post-call webhook received by Bellory.",
    receivedKeys: Object.keys(payload),
  });
}
