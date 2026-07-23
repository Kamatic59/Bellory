import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { salesDials, salesProspects } from "@/db/schema";
import { apiError } from "@/lib/server/api-error";

export const runtime = "nodejs";

const createProspectSchema = z.object({
  company: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40).optional(),
  area: z.string().trim().max(160).optional(),
  tier: z.number().int().min(1).max(4).optional(),
  research: z.string().trim().max(2000).optional(),
  angle: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export async function GET() {
  try {
    const db = getDb();
    const prospects = await db
      .select({
        id: salesProspects.id,
        company: salesProspects.company,
        phone: salesProspects.phone,
        altPhones: salesProspects.altPhones,
        area: salesProspects.area,
        tier: salesProspects.tier,
        research: salesProspects.research,
        angle: salesProspects.angle,
        status: salesProspects.status,
        nextActionAt: salesProspects.nextActionAt,
        notes: salesProspects.notes,
        source: salesProspects.source,
        createdAt: salesProspects.createdAt,
        dialCount: sql<number>`count(${salesDials.id})::int`,
        lastDialAt: sql<string | null>`max(${salesDials.createdAt})`,
      })
      .from(salesProspects)
      .leftJoin(salesDials, sql`${salesDials.prospectId} = ${salesProspects.id}`)
      .groupBy(salesProspects.id)
      .orderBy(salesProspects.tier, salesProspects.company);

    return Response.json({ ok: true, prospects });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = createProspectSchema.parse(await request.json());
    const db = getDb();
    const [prospect] = await db
      .insert(salesProspects)
      .values({
        company: input.company,
        phone: input.phone || null,
        area: input.area || null,
        tier: input.tier ?? 1,
        research: input.research || null,
        angle: input.angle || null,
        notes: input.notes || null,
        source: "manual",
      })
      .returning();

    return Response.json({ ok: true, prospect }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ ok: false, error: "Invalid prospect payload", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("sales_prospects_company_idx")) {
      return Response.json({ ok: false, error: "A prospect with that company name already exists." }, { status: 409 });
    }
    return apiError(error);
  }
}
