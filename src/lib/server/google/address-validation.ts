import { getOptionalEnv } from "@/lib/server/env";

/**
 * Checks that a service address the caller gave over the phone is a real place
 * a truck can be sent to.
 *
 * The governing asymmetry: a false reject is far more expensive than a false
 * accept. If this rejects a real address the agent starts interrogating a
 * customer about where they live, the customer decides the robot is broken, and
 * the shop loses a job worth hundreds of dollars to the next number on Google.
 * If it accepts a bad one the worst case is a single wasted truck roll, and
 * even that usually self-corrects because the tech phones ahead. So there is
 * deliberately no "rejected" state here, and nothing this module returns is
 * ever allowed to block a booking.
 *
 * That matters more than it sounds: the strongest negative signal the API can
 * give (no confirmed premise, no USPS delivery point) is also exactly what a
 * brand new subdivision returns, and new builds are prime garage door
 * customers. Rural highway addresses and Utah's grid addresses land there too.
 */

export type AddressVerification =
  | { status: "confirmed"; normalizedAddress: string; spokenAddress: string; dpv: string | null }
  | { status: "corrected"; normalizedAddress: string; spokenAddress: string; dpv: string | null }
  | { status: "unverified"; reason: "not_found" | "incomplete" | "route_only" | "timeout" | "error" | "disabled" };

type ValidationResponse = {
  result?: {
    verdict?: {
      validationGranularity?: string;
      addressComplete?: boolean;
      hasInferredComponents?: boolean;
      hasReplacedComponents?: boolean;
      hasSpellCorrectedComponents?: boolean;
      possibleNextAction?: string;
    };
    address?: {
      formattedAddress?: string;
      missingComponentTypes?: string[];
      postalAddress?: { addressLines?: string[]; locality?: string };
    };
    uspsData?: { dpvConfirmation?: string };
  };
};

// Granularity values that mean "we found the actual building", as opposed to
// only finding the street it is supposed to be on.
const PREMISE_LEVEL = new Set(["PREMISE", "SUB_PREMISE"]);
// DPV confirmation: Y = deliverable, D = deliverable but missing a unit number,
// S = the building exists but the unit does not match. For a garage door shop
// the unit number is usually irrelevant, so S and D are still good addresses.
const DELIVERABLE_DPV = new Set(["Y", "D", "S"]);

/**
 * What the agent should actually say out loud. Never the API's formatted
 * address: that comes back as "1420 E Kesler Ct, Sandy, UT 84070-1234, USA",
 * and an agent reciting a ZIP+4 and "USA" is the "sounds like a robot"
 * complaint made worse. House number, street and town only.
 */
function buildSpokenAddress(res: NonNullable<ValidationResponse["result"]>, fallback: string): string {
  const postal = res.address?.postalAddress;
  const line = postal?.addressLines?.[0]?.trim();
  const town = postal?.locality?.trim();
  if (line && town) return `${line} in ${town}`;
  if (line) return line;
  return fallback;
}

export async function verifyServiceAddress(rawAddress: string, debugSink?: Record<string, unknown>): Promise<AddressVerification> {
  const address = rawAddress.trim();
  if (!address) return { status: "unverified", reason: "incomplete" };

  // The presence of the key IS the feature flag. Without it every result is
  // "unverified", the agent gets the fail-open instruction, and behaviour is
  // identical to before this existed.
  const apiKey = getOptionalEnv("GOOGLE_MAPS_API_KEY");
  if (!apiKey) return { status: "unverified", reason: "disabled" };

  let body: ValidationResponse;
  try {
    const response = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: { regionCode: "US", addressLines: [address] },
          // Adds real USPS delivery-point data, which is the only signal that
          // separates a misheard house number from a correct one. Both
          // interpolate to a plausible pin without it.
          enableUspsCass: true,
        }),
        // This runs mid-conversation, so a slow answer is worse than no answer.
        signal: AbortSignal.timeout(1200),
      },
    );
    if (!response.ok) return { status: "unverified", reason: "error" };
    body = (await response.json()) as ValidationResponse;
  } catch (error) {
    return { status: "unverified", reason: error instanceof Error && error.name === "TimeoutError" ? "timeout" : "error" };
  }

  const res = body.result;
  if (!res) return { status: "unverified", reason: "error" };

  const verdict = res.verdict ?? {};
  const granularity = verdict.validationGranularity ?? "OTHER";
  const dpv = res.uspsData?.dpvConfirmation ?? null;
  const normalizedAddress = res.address?.formattedAddress?.trim() || address;
  const spokenAddress = buildSpokenAddress(res, address);

  if (debugSink) {
    debugSink.granularity = granularity;
    debugSink.dpv = dpv;
    debugSink.possibleNextAction = verdict.possibleNextAction ?? null;
    debugSink.addressComplete = verdict.addressComplete ?? null;
    debugSink.hasInferred = verdict.hasInferredComponents ?? null;
    debugSink.hasReplaced = verdict.hasReplacedComponents ?? null;
    debugSink.hasSpellCorrected = verdict.hasSpellCorrectedComponents ?? null;
    debugSink.missing = res.address?.missingComponentTypes ?? [];
    debugSink.formatted = res.address?.formattedAddress ?? null;
  }

  // Measured against real Utah addresses before trusting any of this. Every
  // genuine address came back PREMISE; only the invented one dropped to OTHER
  // with a FIX action. So granularity plus possibleNextAction is the real
  // discriminator, and the first cut of these thresholds rejected 5 of 7 real
  // addresses, which would have been far worse than no checking at all.
  const nextAction = verdict.possibleNextAction;

  // Google's own summary verdict, and the only one that fired on a fake house
  // number.
  if (nextAction === "FIX") return { status: "unverified", reason: "not_found" };

  if (!PREMISE_LEVEL.has(granularity)) {
    return { status: "unverified", reason: granularity === "ROUTE" ? "route_only" : "not_found" };
  }

  // A missing subpremise is an apartment or suite number. Google reports it as
  // a missing component, but for a garage door call the unit number is usually
  // meaningless — the truck is going to the building. Treating it as a failure
  // rejected the downtown library, which plainly exists.
  const essentialMissing = (res.address?.missingComponentTypes ?? []).filter((type) => type !== "subpremise");
  if (essentialMissing.length > 0) return { status: "unverified", reason: "incomplete" };

  // USPS delivery-point data only arrives for some addresses; when it is absent
  // it is not evidence of anything. Only an explicit bad code counts against.
  if (dpv !== null && !DELIVERABLE_DPV.has(dpv)) return { status: "unverified", reason: "not_found" };

  if (nextAction === "ACCEPT") return { status: "confirmed", normalizedAddress, spokenAddress, dpv };

  // Deliberately does NOT include hasInferredComponents: Google infers the ZIP
  // and state whenever a caller gives street and city alone, which is what
  // people say out loud. Counting that as a correction flagged almost every
  // normal address.
  const wasChanged =
    nextAction === "CONFIRM" ||
    nextAction === "CONFIRM_ADD_SUBPREMISES" ||
    verdict.hasReplacedComponents === true ||
    verdict.hasSpellCorrectedComponents === true;

  return wasChanged
    ? { status: "corrected", normalizedAddress, spokenAddress, dpv }
    : { status: "confirmed", normalizedAddress, spokenAddress, dpv };
}
