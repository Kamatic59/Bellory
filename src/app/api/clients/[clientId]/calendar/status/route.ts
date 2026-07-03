import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { calendarConnections } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await context.params;
  const db = getDb();

  const [connection] = await db
    .select({
      status: calendarConnections.status,
      email: calendarConnections.providerAccountEmail,
      updatedAt: calendarConnections.updatedAt,
    })
    .from(calendarConnections)
    .where(and(eq(calendarConnections.clientId, clientId), eq(calendarConnections.provider, "google")))
    .orderBy(desc(calendarConnections.updatedAt))
    .limit(1);

  return Response.json({
    ok: true,
    connected: connection?.status === "connected",
    status: connection?.status ?? "not_connected",
    email: connection?.email ?? null,
    updatedAt: connection?.updatedAt ?? null,
  });
}
