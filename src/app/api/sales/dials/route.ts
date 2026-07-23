import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { salesDials, salesProspects } from "@/db/schema";
import { apiError } from "@/lib/server/api-error";

export const runtime = "nodejs";

const logDialSchema = z.object({
  prospectId: z.string().uuid(),
  outcome: z.enum([
    "no_answer",
    "voicemail",
    "gatekeeper",
    "conversation",
    "demo_committed",
    "pilot_agreed",
    "became_paying",
    "not_fit",
  ]),
  caller: z.string().trim().max(80).optional(),
  note: z.string().trim().max(2000).optional(),
  nextActionAt: z.string().datetime({ offset: true }).nullable().optional(),
});

// Pipeline stage each outcome advances the prospect to. A prospect never moves
// backwards from logging a dial; not_fit always applies.
const statusRank = { untouched: 0, working: 1, demo_sent: 2, pilot: 3, paying: 4, not_fit: 0 } as const;
const outcomeStatus = {
  no_answer: "working",
  voicemail: "working",
  gatekeeper: "working",
  conversation: "working",
  demo_committed: "demo_sent",
  pilot_agreed: "pilot",
  became_paying: "paying",
  not_fit: "not_fit",
} as const;

export async function GET() {
  try {
    const db = getDb();
    const dials = await db.select().from(salesDials).orderBy(desc(salesDials.createdAt)).limit(2000);
    return Response.json({ ok: true, dials });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = logDialSchema.parse(await request.json());
    const db = getDb();

    const result = await db.transaction(async (tx) => {
      const [prospect] = await tx.select().from(salesProspects).where(eq(salesProspects.id, input.prospectId));
      if (!prospect) return null;

      const [dial] = await tx
        .insert(salesDials)
        .values({
          prospectId: input.prospectId,
          outcome: input.outcome,
          caller: input.caller || null,
          note: input.note || null,
        })
        .returning();

      const advanced = outcomeStatus[input.outcome];
      const nextStatus =
        advanced === "not_fit" || statusRank[advanced] > statusRank[prospect.status] ? advanced : prospect.status;

      const patch: Record<string, unknown> = { status: nextStatus, updatedAt: new Date() };
      if (input.nextActionAt !== undefined) {
        patch.nextActionAt = input.nextActionAt ? new Date(input.nextActionAt) : null;
      }

      const [updatedProspect] = await tx
        .update(salesProspects)
        .set(patch)
        .where(eq(salesProspects.id, input.prospectId))
        .returning();

      return { dial, prospect: updatedProspect };
    });

    if (!result) {
      return Response.json({ ok: false, error: "Prospect not found." }, { status: 404 });
    }

    return Response.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ ok: false, error: "Invalid dial payload", issues: error.issues }, { status: 400 });
    }
    return apiError(error);
  }
}
