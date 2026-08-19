import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { callTranscriptMessages, calls } from "@/db/schema";

export const runtime = "nodejs";

/**
 * Operator diagnostic: read back what the agent actually said, word for word.
 *
 * Call summaries tell you what happened; they do not tell you how it sounded.
 * Tuning the agent's voice from a summary means guessing at the wording, and
 * guessing is how "sounds robotic" stayed unfixed across several rounds.
 *
 * Admin-only via the console proxy.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const clientId = params.get("clientId");
  if (!clientId) return Response.json({ error: "Pass ?clientId=..." }, { status: 400 });
  const limit = Math.min(Number(params.get("calls") ?? 1), 5);

  const db = getDb();
  const recent = await db
    .select({ id: calls.id, startedAt: calls.startedAt, seconds: calls.durationSeconds, summary: calls.summary })
    .from(calls)
    .where(eq(calls.clientId, clientId))
    .orderBy(desc(calls.startedAt))
    .limit(limit);

  const out = [];
  for (const call of recent) {
    const lines = await db
      .select({ speaker: callTranscriptMessages.speaker, text: callTranscriptMessages.text, at: callTranscriptMessages.startedAtMs })
      .from(callTranscriptMessages)
      .where(eq(callTranscriptMessages.callId, call.id))
      .orderBy(callTranscriptMessages.startedAtMs);
    out.push({
      startedAt: call.startedAt,
      durationSeconds: call.seconds,
      summary: call.summary,
      turns: lines.length,
      transcript: lines.map((l) => `[${l.at ?? "?"}ms] ${l.speaker}: ${l.text}`),
    });
  }

  return Response.json({ ok: true, calls: out });
}
