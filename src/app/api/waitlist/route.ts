import { z } from "zod";
import { getDb } from "@/db/client";
import { waitlistSignups } from "@/db/schema";
import { apiError } from "@/lib/server/api-error";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const waitlistSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  businessType: z.string().trim().max(120).optional(),
  callVolume: z.string().trim().max(120).optional(),
  goal: z.string().trim().max(180).optional(),
  calendarProvider: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1200).optional(),
  source: z.string().trim().max(80).optional(),
  website: z.string().trim().max(200).optional(),
});

function getClientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

function optionalValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export async function POST(request: Request) {
  try {
    const clientKey = getClientKey(request);
    if (isRateLimited(clientKey)) {
      return Response.json({ ok: false, error: "Too many waitlist attempts. Try again in a minute." }, { status: 429 });
    }

    const input = waitlistSchema.parse(await request.json());
    if (input.website) {
      return Response.json({ ok: true, signup: null }, { status: 201 });
    }

    const now = new Date();
    const signupInput = {
      name: input.name,
      email: input.email,
      company: optionalValue(input.company),
      phone: optionalValue(input.phone),
      businessType: optionalValue(input.businessType),
      callVolume: optionalValue(input.callVolume),
      message: optionalValue(input.message),
      source: input.source || "landing",
    };
    const metadata = {
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      leadDetails: {
        goal: optionalValue(input.goal),
        calendarProvider: optionalValue(input.calendarProvider),
      },
    };

    const [signup] = await getDb()
      .insert(waitlistSignups)
      .values({
        ...signupInput,
        metadata,
      })
      .onConflictDoUpdate({
        target: waitlistSignups.email,
        set: {
          name: signupInput.name,
          company: signupInput.company,
          phone: signupInput.phone,
          businessType: signupInput.businessType,
          callVolume: signupInput.callVolume,
          message: signupInput.message,
          source: signupInput.source,
          metadata,
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
