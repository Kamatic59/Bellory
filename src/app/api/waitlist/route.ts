import { z } from "zod";
import { getDb } from "@/db/client";
import { waitlistSignups } from "@/db/schema";
import { apiError } from "@/lib/server/api-error";

export const runtime = "nodejs";

const waitlistSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  callVolume: z.string().trim().optional(),
  message: z.string().trim().optional(),
  source: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const input = waitlistSchema.parse(await request.json());
    const now = new Date();

    const [signup] = await getDb()
      .insert(waitlistSignups)
      .values({
        ...input,
        source: input.source || "landing",
        metadata: {
          userAgent: request.headers.get("user-agent"),
          referer: request.headers.get("referer"),
        },
      })
      .onConflictDoUpdate({
        target: waitlistSignups.email,
        set: {
          name: input.name,
          company: input.company,
          phone: input.phone,
          businessType: input.businessType,
          callVolume: input.callVolume,
          message: input.message,
          source: input.source || "landing",
          updatedAt: now,
        },
      })
      .returning();

    return Response.json({ ok: true, signup: { id: signup.id, email: signup.email } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ ok: false, error: "Invalid waitlist payload", issues: error.issues }, { status: 400 });
    }

    return apiError(error);
  }
}
