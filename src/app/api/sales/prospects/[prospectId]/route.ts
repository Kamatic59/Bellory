import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { salesProspects } from "@/db/schema";
import { apiError } from "@/lib/server/api-error";
import { getCurrentUser } from "@/lib/server/auth/current-user";

export const runtime = "nodejs";

const updateProspectSchema = z.object({
  company: z.string().trim().min(1).max(160).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  area: z.string().trim().max(160).nullable().optional(),
  tier: z.number().int().min(1).max(4).optional(),
  status: z.enum(["untouched", "working", "demo_sent", "pilot", "paying", "not_fit"]).optional(),
  nextActionAt: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

type RouteContext = { params: Promise<{ prospectId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { prospectId } = await context.params;
    const input = updateProspectSchema.parse(await request.json());

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (input.company !== undefined) patch.company = input.company;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.area !== undefined) patch.area = input.area;
    if (input.tier !== undefined) patch.tier = input.tier;
    if (input.status !== undefined) patch.status = input.status;
    if (input.nextActionAt !== undefined) patch.nextActionAt = input.nextActionAt ? new Date(input.nextActionAt) : null;
    if (input.notes !== undefined) patch.notes = input.notes;

    const db = getDb();
    const [prospect] = await db.update(salesProspects).set(patch).where(eq(salesProspects.id, prospectId)).returning();
    if (!prospect) {
      return Response.json({ ok: false, error: "Prospect not found." }, { status: 404 });
    }

    return Response.json({ ok: true, prospect });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ ok: false, error: "Invalid prospect update", issues: error.issues }, { status: 400 });
    }
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    // Deleting is destructive and unrecoverable, so it stays with the owner.
    // Callers can work a prospect and mark it "not a fit", but not erase it.
    const user = await getCurrentUser();
    if (user && user.role !== "admin") {
      return Response.json(
        { ok: false, error: "Only the owner can delete a prospect. Log it as \"Not a fit\" instead." },
        { status: 403 },
      );
    }

    const { prospectId } = await context.params;
    const db = getDb();
    const deleted = await db.delete(salesProspects).where(eq(salesProspects.id, prospectId)).returning({ id: salesProspects.id });
    if (deleted.length === 0) {
      return Response.json({ ok: false, error: "Prospect not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
