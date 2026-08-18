import { verifyServiceAddress } from "@/lib/server/google/address-validation";

export const runtime = "nodejs";

/**
 * Operator diagnostic: does this address verify, and what would the agent do
 * with it? Lets someone check a suspect address without placing a call, and
 * lets us measure the false-reject rate against real local addresses before
 * trusting the thing.
 *
 * Admin-only via the console proxy. Never returns the API key or any part of
 * it — only the verdict.
 */
export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!address) {
    return Response.json({ error: "Pass ?address=..." }, { status: 400 });
  }

  const debug: Record<string, unknown> = {};
  const startedAt = Date.now();
  const result = await verifyServiceAddress(address, debug);
  const latencyMs = Date.now() - startedAt;

  return Response.json({
    input: address,
    latencyMs,
    ...result,
    debug,
    // What the caller would actually experience.
    callerImpact:
      result.status === "confirmed" ? "Nothing. Booked silently."
      : result.status === "corrected" ? "Hears the tidied address in the recap and confirms it."
      : "Hears the house number read back digit by digit once, then books either way.",
  });
}
