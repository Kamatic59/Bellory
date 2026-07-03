import { getOptionalEnv } from "@/lib/server/env";

export const runtime = "nodejs";

type RawVoice = {
  voice_id: string;
  name: string;
  preview_url?: string;
  labels?: Record<string, string>;
};

export async function GET() {
  const apiKey = getOptionalEnv("ELEVENLABS_API_KEY");
  if (!apiKey) return Response.json({ ok: false, error: "ElevenLabs is not configured" }, { status: 500 });

  const response = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": apiKey } });
  const body = await response.json().catch(() => null) as { voices?: RawVoice[] } | null;
  if (!response.ok) return Response.json({ ok: false, error: `Voice list failed (${response.status})` }, { status: 502 });

  const voices = (body?.voices ?? []).map((voice) => ({
    voiceId: voice.voice_id,
    name: voice.name,
    description: Object.values(voice.labels ?? {}).filter(Boolean).join(", "),
    previewUrl: voice.preview_url ?? null,
  }));

  return Response.json({ ok: true, voices });
}
