import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients } from "@/db/schema";
import { buildAuthorizationUrl } from "@/lib/server/google/oauth";
import { getOptionalEnv } from "@/lib/server/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!getOptionalEnv("GOOGLE_CLIENT_ID") || !getOptionalEnv("GOOGLE_CLIENT_SECRET")) {
    return Response.json({ ok: false, error: "Google OAuth is not configured." }, { status: 500 });
  }

  const clientId = new URL(request.url).searchParams.get("clientId");
  if (!clientId) {
    return Response.json({ ok: false, error: "clientId query parameter is required." }, { status: 400 });
  }

  const db = getDb();
  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) {
    return Response.json({ ok: false, error: "Client not found." }, { status: 404 });
  }

  return Response.redirect(buildAuthorizationUrl(clientId), 302);
}
