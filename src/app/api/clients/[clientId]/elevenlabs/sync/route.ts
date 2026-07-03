import { syncClientAgent } from "@/lib/server/elevenlabs/agent-sync";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await context.params;

  try {
    const result = await syncClientAgent(clientId);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("elevenlabs sync failed", error);
    const message = error instanceof Error ? error.message : "ElevenLabs sync failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
