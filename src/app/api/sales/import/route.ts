import { getDb } from "@/db/client";
import { salesProspects } from "@/db/schema";
import { apiError } from "@/lib/server/api-error";
import { UTAH_PROSPECTS_SOURCE, utahProspects } from "@/data/utah-prospects";

export const runtime = "nodejs";

// Idempotent: prospects that already exist (by company name) are skipped, so
// re-importing never duplicates or overwrites logged work.
export async function POST() {
  try {
    const db = getDb();
    const inserted = await db
      .insert(salesProspects)
      .values(
        utahProspects.map((prospect) => ({
          company: prospect.company,
          phone: prospect.phone,
          altPhones: prospect.altPhones ?? [],
          area: prospect.area,
          tier: prospect.tier,
          research: prospect.research,
          angle: prospect.angle,
          source: UTAH_PROSPECTS_SOURCE,
        })),
      )
      .onConflictDoNothing({ target: salesProspects.company })
      .returning({ id: salesProspects.id });

    return Response.json({
      ok: true,
      inserted: inserted.length,
      skipped: utahProspects.length - inserted.length,
    });
  } catch (error) {
    return apiError(error);
  }
}
