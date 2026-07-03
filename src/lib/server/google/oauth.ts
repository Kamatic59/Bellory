import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getRequiredEnv } from "@/lib/server/env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const OAUTH_SCOPES = "https://www.googleapis.com/auth/calendar openid email";
const STATE_TTL_MS = 15 * 60_000;

function encryptionKey(): Buffer {
  return createHash("sha256").update(getRequiredEnv("ENCRYPTION_KEY")).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/** CSRF protection: the callback only accepts client ids we signed ourselves. */
export function signOauthState(clientId: string): string {
  const expiresAt = Date.now() + STATE_TTL_MS;
  const message = `${clientId}.${expiresAt}`;
  const signature = createHmac("sha256", encryptionKey()).update(message).digest("hex");
  return `${message}.${signature}`;
}

export function verifyOauthState(state: string | null): { ok: true; clientId: string } | { ok: false; reason: string } {
  if (!state) return { ok: false, reason: "Missing state" };
  const parts = state.split(".");
  if (parts.length !== 3) return { ok: false, reason: "Malformed state" };

  const [clientId, expiresAt, signature] = parts;
  const expected = createHmac("sha256", encryptionKey()).update(`${clientId}.${expiresAt}`).digest("hex");
  const provided = Buffer.from(signature, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) {
    return { ok: false, reason: "Invalid state signature" };
  }
  if (Number(expiresAt) < Date.now()) return { ok: false, reason: "State expired" };
  return { ok: true, clientId };
}

export function oauthRedirectUri(): string {
  return `${getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "")}/api/google/oauth/callback`;
}

export function buildAuthorizationUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: getRequiredEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: oauthRedirectUri(),
    response_type: "code",
    scope: OAUTH_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: signOauthState(clientId),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getRequiredEnv("GOOGLE_CLIENT_ID"),
      client_secret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
      redirect_uri: oauthRedirectUri(),
    }),
  });
  return response.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getRequiredEnv("GOOGLE_CLIENT_ID"),
      client_secret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return response.json() as Promise<TokenResponse>;
}

export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const body = await response.json().catch(() => null) as { email?: string } | null;
  return body?.email ?? null;
}
