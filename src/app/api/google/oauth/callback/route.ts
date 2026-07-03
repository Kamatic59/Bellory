import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { calendarConnections } from "@/db/schema";
import { saveClientConfigDraft } from "@/lib/server/clients/client-config-store";
import { encryptSecret, exchangeCodeForTokens, fetchGoogleEmail, verifyOauthState } from "@/lib/server/google/oauth";
import { getRequiredEnv } from "@/lib/server/env";

export const runtime = "nodejs";

function adminRedirect(query: string) {
  const base = getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
  return Response.redirect(`${base}/admin?${query}`, 302);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) return adminRedirect(`calendar=error&reason=${encodeURIComponent(error)}`);

  const state = verifyOauthState(url.searchParams.get("state"));
  if (!state.ok) return adminRedirect(`calendar=error&reason=${encodeURIComponent(state.reason)}`);

  const code = url.searchParams.get("code");
  if (!code) return adminRedirect("calendar=error&reason=missing_code");

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens.refresh_token || !tokens.access_token) {
    const reason = tokens.error_description ?? tokens.error ?? "no_refresh_token";
    return adminRedirect(`calendar=error&reason=${encodeURIComponent(reason)}`);
  }

  const email = await fetchGoogleEmail(tokens.access_token);
  const db = getDb();

  const values = {
    provider: "google",
    providerAccountEmail: email,
    primaryCalendarId: "primary",
    status: "connected" as const,
    encryptedRefreshToken: encryptSecret(tokens.refresh_token),
    metadata: { connectedAt: new Date().toISOString(), scopes: "calendar" },
  };

  const [existing] = await db
    .select({ id: calendarConnections.id })
    .from(calendarConnections)
    .where(and(eq(calendarConnections.clientId, state.clientId), eq(calendarConnections.provider, "google")))
    .limit(1);

  const connectionId = existing
    ? (await db.update(calendarConnections).set({ ...values, updatedAt: new Date() }).where(eq(calendarConnections.id, existing.id)).returning({ id: calendarConnections.id }))[0].id
    : (await db.insert(calendarConnections).values({ clientId: state.clientId, ...values }).returning({ id: calendarConnections.id }))[0].id;

  await saveClientConfigDraft(state.clientId, {
    calendarAndDispatch: { provider: "google" },
    integrations: { googleCalendar: { status: "connected", provider: "google", connectionId } },
  });

  return adminRedirect("calendar=connected");
}
