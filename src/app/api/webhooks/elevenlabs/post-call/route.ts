import { processPostCallWebhook, verifyElevenLabsSignature } from "@/lib/server/webhooks/elevenlabs-post-call";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const signature = verifyElevenLabsSignature(rawBody, request.headers.get("elevenlabs-signature"));
  if (!signature.ok) {
    return Response.json({ ok: false, error: signature.reason }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const outcome = await processPostCallWebhook(payload);
    // Always return 200 for processed-but-unmatched payloads so ElevenLabs
    // does not retry a webhook that will never match.
    return Response.json(outcome, { status: 200 });
  } catch (error) {
    console.error("elevenlabs post-call: processing failed", error);
    return Response.json({ ok: false, error: "Processing failed" }, { status: 500 });
  }
}
