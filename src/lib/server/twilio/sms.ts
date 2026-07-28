import { getOptionalEnv } from "@/lib/server/env";

const TWILIO_API = "https://api.twilio.com/2010-04-01";

export type SmsResult = { ok: true; sid: string } | { ok: false; error: string; disabled?: true };

/**
 * US carriers block application SMS from numbers without A2P 10DLC
 * registration — and Twilio accepts the API call before dropping the message,
 * so an unregistered sender looks like success in code while nothing arrives.
 * SMS therefore stays off until registration is done: set SMS_ENABLED=true
 * (and redeploy) once the brand + campaign are approved.
 */
export function smsEnabled(): boolean {
  return getOptionalEnv("SMS_ENABLED") === "true";
}

export function normalizeE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return /^\+1\d{10}$/.test(raw.trim()) ? raw.trim() : null;
}

/**
 * Sends one SMS through Twilio. `from` defaults to TWILIO_PHONE_NUMBER; pass
 * the client's own Bellory number when it exists so texts come from the number
 * the caller already knows.
 */
export async function sendSms(input: { to: string; body: string; from?: string | null }): Promise<SmsResult> {
  if (!smsEnabled()) {
    return { ok: false, error: "SMS is disabled until A2P 10DLC registration is complete (set SMS_ENABLED=true).", disabled: true };
  }

  const sid = getOptionalEnv("TWILIO_ACCOUNT_SID");
  const token = getOptionalEnv("TWILIO_AUTH_TOKEN");
  if (!sid || !token) return { ok: false, error: "Twilio is not configured." };

  const to = normalizeE164(input.to);
  if (!to) return { ok: false, error: `Not a valid US phone number: ${input.to}` };

  const from = normalizeE164(input.from) ?? normalizeE164(getOptionalEnv("TWILIO_PHONE_NUMBER"));
  if (!from) return { ok: false, error: "No sending number: set TWILIO_PHONE_NUMBER or connect a client number." };

  const response = await fetch(`${TWILIO_API}/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: input.body }),
  });
  const body = await response.json().catch(() => null) as { sid?: string; message?: string } | null;

  if (response.status >= 400 || !body?.sid) {
    return { ok: false, error: `Twilio send failed (${response.status}): ${body?.message ?? "unknown error"}` };
  }
  return { ok: true, sid: body.sid };
}
