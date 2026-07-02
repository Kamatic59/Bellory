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
const demoVoiceId = process.env.ELEVENLABS_DEMO_VOICE_ID || process.env.ELEVENLABS_DEFAULT_VOICE_ID;
const callerVoiceId = process.env.ELEVENLABS_CALLER_VOICE_ID;
const agentId = process.env.ELEVENLABS_DEFAULT_AGENT_ID;

if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY in .env.local.");
  process.exit(1);
}

async function eleven(pathname) {
  const response = await fetch(`https://api.elevenlabs.io/v1${pathname}`, {
    headers: { "xi-api-key": apiKey },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${pathname} failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function checkVoice(label, voiceId) {
  if (!voiceId) {
    console.log(`MISSING ${label}: add a voice ID when you have picked one`);
    return;
  }

  const voice = await eleven(`/voices/${voiceId}`);
  console.log(`OK ${label}: ${voice.name || voice.voice_id || voiceId}`);
}

const user = await eleven("/user");
const subscription = user.subscription || {};
console.log("ElevenLabs account");
console.log(`OK API key: authenticated`);
console.log(`Tier: ${subscription.tier || subscription.status || "unknown"}`);
console.log(`Characters: ${subscription.character_count ?? "unknown"} / ${subscription.character_limit ?? "unknown"}`);

await checkVoice("Bellory demo/default voice", demoVoiceId);
await checkVoice("Caller demo voice", callerVoiceId);

if (agentId) {
  console.log(`OK default agent ID present: ${agentId}`);
} else {
  console.log("MISSING default agent ID: only needed when we connect live phone agents");
}
