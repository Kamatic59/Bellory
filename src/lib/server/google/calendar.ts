import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { calendarConnections, clientIssues, clients } from "@/db/schema";
import { decryptSecret, refreshAccessToken } from "./oauth";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export type CalendarConnection = typeof calendarConnections.$inferSelect;

export async function getActiveCalendarConnection(clientId: string): Promise<CalendarConnection | null> {
  const db = getDb();
  const [connection] = await db
    .select()
    .from(calendarConnections)
    .where(and(
      eq(calendarConnections.clientId, clientId),
      eq(calendarConnections.provider, "google"),
      eq(calendarConnections.status, "connected"),
    ))
    .orderBy(desc(calendarConnections.updatedAt))
    .limit(1);

  return connection?.encryptedRefreshToken ? connection : null;
}

async function markConnectionBroken(connection: CalendarConnection, detail: string) {
  const db = getDb();
  await db.update(calendarConnections)
    .set({ status: "issue", metadata: { ...connection.metadata, lastError: detail }, updatedAt: new Date() })
    .where(eq(calendarConnections.id, connection.id));

  const [client] = await db.select({ organizationId: clients.organizationId, name: clients.name }).from(clients).where(eq(clients.id, connection.clientId)).limit(1);
  if (!client) return;

  const title = "Google Calendar connection needs attention";
  const [existing] = await db
    .select({ id: clientIssues.id })
    .from(clientIssues)
    .where(and(eq(clientIssues.clientId, connection.clientId), eq(clientIssues.status, "open"), eq(clientIssues.title, title)))
    .limit(1);
  if (existing) return;

  await db.insert(clientIssues).values({
    organizationId: client.organizationId,
    clientId: connection.clientId,
    severity: "high",
    status: "open",
    source: "calendar",
    title,
    description: `Google rejected the stored credentials (${detail}). Reconnect the calendar from the Calendar & Dispatch tab. Availability falls back to business-hours rules until then.`,
    actionLabel: "Reconnect calendar",
    metadata: { connectionId: connection.id },
  });
}

async function getAccessToken(connection: CalendarConnection): Promise<string | null> {
  try {
    const refreshToken = decryptSecret(connection.encryptedRefreshToken!);
    const tokens = await refreshAccessToken(refreshToken);
    if (!tokens.access_token) {
      if (tokens.error === "invalid_grant") await markConnectionBroken(connection, "invalid_grant");
      return null;
    }
    return tokens.access_token;
  } catch (error) {
    console.error("google calendar: token refresh failed", error);
    return null;
  }
}

export type BusyInterval = { startsAt: Date; endsAt: Date };

/** Busy intervals from the connected calendar; null when the lookup fails. */
export async function fetchBusyIntervals(connection: CalendarConnection, timeMin: Date, timeMax: Date): Promise<BusyInterval[] | null> {
  const accessToken = await getAccessToken(connection);
  if (!accessToken) return null;

  const calendarId = connection.primaryCalendarId || "primary";
  const response = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  });
  if (!response.ok) {
    console.error("google calendar: freeBusy failed", response.status, await response.text().catch(() => ""));
    return null;
  }

  const body = await response.json().catch(() => null) as { calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }> } | null;
  const busy = body?.calendars?.[calendarId]?.busy ?? body?.calendars?.primary?.busy ?? [];
  return busy.map((interval) => ({ startsAt: new Date(interval.start), endsAt: new Date(interval.end) }));
}

export async function createCalendarEvent(
  connection: CalendarConnection,
  event: { summary: string; description: string; startsAt: Date; endsAt: Date; timeZone: string },
): Promise<{ eventId: string; htmlLink: string | null } | null> {
  const accessToken = await getAccessToken(connection);
  if (!accessToken) return null;

  const calendarId = connection.primaryCalendarId || "primary";
  const response = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.startsAt.toISOString(), timeZone: event.timeZone },
      end: { dateTime: event.endsAt.toISOString(), timeZone: event.timeZone },
    }),
  });
  if (!response.ok) {
    console.error("google calendar: event creation failed", response.status, await response.text().catch(() => ""));
    return null;
  }

  const body = await response.json().catch(() => null) as { id?: string; htmlLink?: string } | null;
  return body?.id ? { eventId: body.id, htmlLink: body.htmlLink ?? null } : null;
}
