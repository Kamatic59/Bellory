import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { calendarConnections } from "@/db/schema";
import { apiError } from "@/lib/server/api-error";
import { getActiveCalendarConnection, listCalendars } from "@/lib/server/google/calendar";

export const runtime = "nodejs";

/** Which calendars this shop's Google account can write to, and the one in use. */
export async function GET(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await context.params;
    const connection = await getActiveCalendarConnection(clientId);
    if (!connection) {
      return Response.json({ ok: false, error: "No Google Calendar is connected for this business yet." }, { status: 404 });
    }

    const calendars = await listCalendars(connection);
    if (!calendars) {
      return Response.json(
        { ok: false, error: "Google would not list this account's calendars — the connection may need reconnecting." },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true,
      selectedCalendarId: connection.primaryCalendarId || "primary",
      accountEmail: connection.providerAccountEmail,
      calendars,
    });
  } catch (error) {
    return apiError(error);
  }
}

const selectSchema = z.object({ calendarId: z.string().trim().min(1) });

/** Point bookings at a different calendar (a shared "Jobs" calendar, usually). */
export async function PATCH(request: Request, context: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await context.params;
    const { calendarId } = selectSchema.parse(await request.json());

    const connection = await getActiveCalendarConnection(clientId);
    if (!connection) {
      return Response.json({ ok: false, error: "No Google Calendar is connected for this business yet." }, { status: 404 });
    }

    // Only accept a calendar this account can actually write to — otherwise
    // bookings fail silently at call time.
    const calendars = await listCalendars(connection);
    if (calendars && !calendars.some((calendar) => calendar.id === calendarId)) {
      return Response.json(
        { ok: false, error: "That calendar isn't writable by the connected Google account." },
        { status: 400 },
      );
    }

    const db = getDb();
    await db
      .update(calendarConnections)
      .set({ primaryCalendarId: calendarId, updatedAt: new Date() })
      .where(eq(calendarConnections.id, connection.id));

    return Response.json({ ok: true, selectedCalendarId: calendarId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ ok: false, error: "A calendar id is required." }, { status: 400 });
    }
    return apiError(error);
  }
}
