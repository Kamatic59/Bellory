import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
const envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const separator = trimmed.indexOf("=");
  if (separator === -1) continue;

  const key = trimmed.slice(0, separator);
  const value = trimmed.slice(separator + 1);
  process.env[key] ||= value;
}

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_DEMO_VOICE_ID || process.env.ELEVENLABS_DEFAULT_VOICE_ID;
const modelId = process.env.ELEVENLABS_DEMO_MODEL_ID || "eleven_multilingual_v2";
const outputFormat = process.env.ELEVENLABS_DEMO_OUTPUT_FORMAT || "mp3_22050_32";
const outputPath = path.join(process.cwd(), "public", "audio", "bellory-garage-door-demo.mp3");

const demoScript = process.env.BELLORY_DEMO_SCRIPT || [
  "Hi, this is Bellory with Canyon Garage Doors.",
  "How can I help?",
  "I can help with that.",
  "Is the door stuck fully closed, or is it off track too?",
  "Got it.",
  "Because your car is trapped, I'll treat this as urgent.",
  "Let me check the soonest opening, and if I can't get this placed right away, I'll forward you to someone who can help better.",
].join(" ");

if (!apiKey) {
  throw new Error("Missing ELEVENLABS_API_KEY in .env.local or environment.");
}

if (!voiceId) {
  throw new Error("Missing ELEVENLABS_DEMO_VOICE_ID or ELEVENLABS_DEFAULT_VOICE_ID in .env.local or environment.");
}

const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "xi-api-key": apiKey,
  },
  body: JSON.stringify({
    text: demoScript,
    model_id: modelId,
    voice_settings: {
      stability: 0.42,
      similarity_boost: 0.78,
      style: 0.12,
      use_speaker_boost: true,
    },
  }),
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`ElevenLabs demo audio request failed (${response.status}): ${errorText}`);
}

const audio = Buffer.from(await response.arrayBuffer());
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, audio);

console.log(`Generated ${outputPath}`);
console.log(`${audio.length} bytes`);
