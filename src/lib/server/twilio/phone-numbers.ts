import { getOptionalEnv } from "@/lib/server/env";

const TWILIO_API = "https://api.twilio.com/2010-04-01";

function twilioAuth(): { sid: string; header: string } | null {
  const sid = getOptionalEnv("TWILIO_ACCOUNT_SID");
  const token = getOptionalEnv("TWILIO_AUTH_TOKEN");
  if (!sid || !token) return null;
  return { sid, header: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` };
}

export function twilioConfigured(): boolean {
  return twilioAuth() !== null;
}

type TwilioNumber = {
  phoneNumber: string;
  friendlyName: string;
  locality: string | null;
  region: string | null;
  voice: boolean;
  sms: boolean;
};

type RawTwilioNumber = {
  phone_number: string;
  friendly_name?: string;
  locality?: string;
  region?: string;
  capabilities?: { voice?: boolean; SMS?: boolean; sms?: boolean };
};

function mapNumber(raw: RawTwilioNumber): TwilioNumber {
  return {
    phoneNumber: raw.phone_number,
    friendlyName: raw.friendly_name ?? raw.phone_number,
    locality: raw.locality ?? null,
    region: raw.region ?? null,
    voice: raw.capabilities?.voice ?? false,
    sms: raw.capabilities?.SMS ?? raw.capabilities?.sms ?? false,
  };
}

export async function searchAvailableNumbers(areaCode?: string): Promise<{ ok: true; numbers: TwilioNumber[] } | { ok: false; error: string }> {
  const auth = twilioAuth();
  if (!auth) return { ok: false, error: "Twilio is not configured." };

  const params = new URLSearchParams({ VoiceEnabled: "true", PageSize: "8" });
  if (areaCode && /^\d{3}$/.test(areaCode)) params.set("AreaCode", areaCode);

  const response = await fetch(`${TWILIO_API}/Accounts/${auth.sid}/AvailablePhoneNumbers/US/Local.json?${params}`, {
    headers: { Authorization: auth.header },
  });
  const body = await response.json().catch(() => null) as { available_phone_numbers?: RawTwilioNumber[]; message?: string } | null;
  if (!response.ok) return { ok: false, error: body?.message ?? `Twilio search failed (${response.status})` };

  return { ok: true, numbers: (body?.available_phone_numbers ?? []).map(mapNumber) };
}

export async function listOwnedNumbers(): Promise<{ ok: true; numbers: TwilioNumber[] } | { ok: false; error: string }> {
  const auth = twilioAuth();
  if (!auth) return { ok: false, error: "Twilio is not configured." };

  const response = await fetch(`${TWILIO_API}/Accounts/${auth.sid}/IncomingPhoneNumbers.json?PageSize=50`, {
    headers: { Authorization: auth.header },
  });
  const body = await response.json().catch(() => null) as { incoming_phone_numbers?: RawTwilioNumber[]; message?: string } | null;
  if (!response.ok) return { ok: false, error: body?.message ?? `Twilio list failed (${response.status})` };

  return { ok: true, numbers: (body?.incoming_phone_numbers ?? []).map(mapNumber) };
}

export async function purchaseNumber(phoneNumber: string): Promise<{ ok: true; phoneNumber: string } | { ok: false; error: string }> {
  const auth = twilioAuth();
  if (!auth) return { ok: false, error: "Twilio is not configured." };

  const response = await fetch(`${TWILIO_API}/Accounts/${auth.sid}/IncomingPhoneNumbers.json`, {
    method: "POST",
    headers: { Authorization: auth.header, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ PhoneNumber: phoneNumber }),
  });
  const body = await response.json().catch(() => null) as { phone_number?: string; message?: string } | null;
  if (!response.ok || !body?.phone_number) {
    return { ok: false, error: body?.message ?? `Twilio purchase failed (${response.status})` };
  }

  return { ok: true, phoneNumber: body.phone_number };
}
