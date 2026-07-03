import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { appointments, calls, clients, leads } from "@/db/schema";

const ACTIVITY_LIMIT = 25;

export async function getClientActivity(clientId: string) {
  const db = getDb();
  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) return null;

  const [callRows, leadRows, appointmentRows] = await Promise.all([
    db
      .select({
        id: calls.id,
        callerPhone: calls.callerPhone,
        callerName: calls.callerName,
        status: calls.status,
        outcome: calls.outcome,
        summary: calls.summary,
        durationSeconds: calls.durationSeconds,
        startedAt: calls.startedAt,
        createdAt: calls.createdAt,
      })
      .from(calls)
      .where(eq(calls.clientId, clientId))
      .orderBy(desc(calls.createdAt))
      .limit(ACTIVITY_LIMIT),
    db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        issue: leads.issue,
        urgency: leads.urgency,
        status: leads.status,
        summary: leads.summary,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(eq(leads.clientId, clientId))
      .orderBy(desc(leads.createdAt))
      .limit(ACTIVITY_LIMIT),
    db
      .select({
        id: appointments.id,
        callerName: appointments.callerName,
        callerPhone: appointments.callerPhone,
        serviceSummary: appointments.serviceSummary,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
        status: appointments.status,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .where(eq(appointments.clientId, clientId))
      .orderBy(desc(appointments.startsAt))
      .limit(ACTIVITY_LIMIT),
  ]);

  return { calls: callRows, leads: leadRows, appointments: appointmentRows };
}
