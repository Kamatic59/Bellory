import { readAgentToolPayload } from "@/lib/server/agent-tool-responses";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await readAgentToolPayload(request);

  return Response.json({
    ok: true,
    message: "Stripe webhook received by Bellory.",
    receivedKeys: Object.keys(payload),
  });
}
