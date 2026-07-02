import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const groups = {
  app: ["NEXT_PUBLIC_APP_URL", "DATABASE_URL", "DIRECT_DATABASE_URL", "ENCRYPTION_KEY", "AGENT_TOOL_SHARED_SECRET"],
  supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  clerk: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY", "CLERK_WEBHOOK_SECRET"],
  ai: ["OPENAI_API_KEY", "OPENAI_PROJECT_ID"],
  elevenlabs: ["ELEVENLABS_API_KEY", "ELEVENLABS_DEFAULT_VOICE_ID", "ELEVENLABS_DEMO_VOICE_ID"],
  elevenlabsLiveCalls: ["ELEVENLABS_WEBHOOK_SECRET", "ELEVENLABS_DEFAULT_AGENT_ID"],
  twilio: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_API_KEY_SID", "TWILIO_API_KEY_SECRET", "TWILIO_WEBHOOK_SECRET"],
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_WEBHOOK_TOKEN"],
  stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  jobs: ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY", "RESEND_API_KEY", "OWNER_ALERT_FROM_EMAIL"],
  observability: ["SENTRY_DSN", "LOG_DRAIN_TOKEN"],
};

function readDotEnv(path) {
  if (!existsSync(path)) return {};

  const values = {};
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equals = line.indexOf("=");
    if (equals === -1) continue;
    const key = line.slice(0, equals).trim();
    const value = line.slice(equals + 1).trim().replace(/^["']|["']$/g, "");
    values[key] = value;
  }
  return values;
}

const localEnv = {
  ...readDotEnv(resolve(process.cwd(), ".env")),
  ...readDotEnv(resolve(process.cwd(), ".env.local")),
  ...process.env,
};

let missingCount = 0;

console.log("Bellory setup check\n");
for (const [group, keys] of Object.entries(groups)) {
  const missing = keys.filter((key) => !localEnv[key]);
  if (missing.length === 0) {
    console.log(`OK ${group}: all ${keys.length} variables present`);
  } else {
    missingCount += missing.length;
    console.log(`MISSING ${group}: ${missing.join(", ")}`);
  }
}

if (missingCount > 0) {
  console.log(`\n${missingCount} variables still need values. Copy .env.example to .env.local and fill in the accounts you have created.`);
  process.exitCode = 1;
} else {
  console.log("\nAll expected environment variables are present.");
}
