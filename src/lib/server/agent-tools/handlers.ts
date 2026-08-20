import { and, asc, desc, eq, inArray, lt, gt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { agentToolCalls, appointments, clientIssues, leads, ownerNotifications } from "@/db/schema";
import type { BelloryClientConfig } from "@/lib/server/config/client-config-schema";
import { verifyServiceAddress, type AddressVerification } from "@/lib/server/google/address-validation";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchBusyIntervals,
  getActiveCalendarConnection,
  updateCalendarEventTime,
  type CalendarConnection,
} from "@/lib/server/google/calendar";
import type { AgentToolPayload } from "@/lib/server/agent-tool-responses";
import { resolveTransferNumber } from "@/lib/server/elevenlabs/agent-sync";
import { normalizeE164, sendSms } from "@/lib/server/twilio/sms";
import type { AgentToolContext, AgentToolHandler, AgentToolResult } from "./runtime";

/* ------------------------------ input helpers ----------------------------- */

const optionalText = z
  .preprocess((value) => (typeof value === "number" ? String(value) : value), z.string().trim().min(1))
  .optional();

const looseBoolean = z
  .preprocess((value) => {
    if (typeof value === "string") return ["true", "yes", "y", "1"].includes(value.trim().toLowerCase());
    return value;
  }, z.boolean())
  .optional();

function askAgainResult(message: string): AgentToolResult {
  return { ok: false, message };
}

function normalizePhone(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("1")) return `+${cleaned}`;
  return cleaned;
}

function formatCents(cents: number): string {
  const dollars = cents / 100;
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
}

/** Texts come from the client's own Bellory number when one is connected. */
function clientSmsFrom(config: BelloryClientConfig): string | null {
  return normalizeE164(config.phoneRouting.belloryNumber) ?? null;
}

/**
 * The number the caller is dialing from, passed by ElevenLabs as a system
 * dynamic variable on real phone calls. Test/widget calls send the "unknown"
 * placeholder, and blocked caller IDs arrive as non-numeric strings.
 */
function callerIdPhone(payload: AgentToolPayload): string | null {
  const raw = payload.callerId;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || /unknown|anonymous|restricted|private/i.test(trimmed)) return null;
  const normalized = normalizePhone(trimmed);
  return /^\+?\d{7,15}$/.test(normalized) ? normalized : null;
}

/** Whether the business is open at this moment, with the spoken local time. */
function businessOpenNow(config: BelloryClientConfig) {
  const timeZone = config.businessIdentity.timezone;
  const now = new Date();
  const today = tzDateString(now, timeZone);
  const weekday = tzWeekday(today, timeZone);
  const isHoliday = config.locationsAndHours.holidays.some((holiday) => holiday.date === today);
  const todaysHours = config.locationsAndHours.normalHours[weekday] ?? [];
  const isOpen = !isHoliday && todaysHours.some((range) => {
    const open = zonedTimeToUtc(today, range.open, timeZone);
    const close = zonedTimeToUtc(today, range.close, timeZone);
    return open !== null && close !== null && now >= open && now < close;
  });
  const localTime = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", hour: "numeric", minute: "2-digit" }).format(now);
  return { localTime, weekday, isOpen, isHoliday, todaysHours };
}

/* ---------------------------- timezone helpers ---------------------------- */

/** Calendar date (YYYY-MM-DD) for an instant, in a timezone. */
function tzDateString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

/** Lowercase weekday name ("monday") for a calendar date in a timezone. */
function tzWeekday(dateString: string, timeZone: string): string {
  const noon = new Date(`${dateString}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(noon).toLowerCase();
}

/** Converts a wall-clock time in a timezone to the actual UTC instant. */
function zonedTimeToUtc(dateString: string, timeString: string, timeZone: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) || !/^\d{1,2}:\d{2}$/.test(timeString)) return null;
  const naive = new Date(`${dateString}T${timeString.padStart(5, "0")}:00Z`);
  if (Number.isNaN(naive.getTime())) return null;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(naive).map((part) => [part.type, part.value]));
  const projected = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    parts.hour === "24" ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return new Date(naive.getTime() - (projected - naive.getTime()));
}

function spokenSlot(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/* --------------------------- availability engine -------------------------- */

type Slot = { startsAt: string; endsAt: string; spoken: string };

function appointmentDurationMinutes(config: BelloryClientConfig, requestedType?: string): number {
  const types = config.calendarAndDispatch.appointmentTypes;
  if (requestedType) {
    const wanted = requestedType.toLowerCase();
    const match = types.find((type) => type.name.toLowerCase().includes(wanted) || wanted.includes(type.name.toLowerCase()));
    if (match) return match.durationMinutes;
  }
  return types[0]?.durationMinutes ?? 60;
}

async function loadConflicts(
  clientId: string,
  windowStart: Date,
  windowEnd: Date,
  config: BelloryClientConfig,
  connection?: CalendarConnection | null,
  excludeAppointmentId?: string,
) {
  const db = getDb();
  const conflicts: Array<{ startsAt: Date; endsAt: Date }> = await db
    .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(and(
      eq(appointments.clientId, clientId),
      inArray(appointments.status, ["held", "booked", "needs_approval"]),
      lt(appointments.startsAt, windowEnd),
      gt(appointments.endsAt, windowStart),
      ...(excludeAppointmentId ? [ne(appointments.id, excludeAppointmentId)] : []),
    ));

  // With a connected Google Calendar, real busy time also blocks slots. A
  // failed lookup falls back to rules-only rather than breaking the call —
  // but the caller must not then be offered times the crew is already out on,
  // so the failure is reported back and the agent hedges instead of promising.
  let calendarBusyUnavailable = false;
  if (connection && config.calendarAndDispatch.provider === "google") {
    const busy = await fetchBusyIntervals(connection, windowStart, windowEnd);
    if (busy) conflicts.push(...busy);
    else calendarBusyUnavailable = true;
  }

  return Object.assign(conflicts, { calendarBusyUnavailable });
}

async function generateAvailability(
  context: AgentToolContext,
  options: { preferredDate?: string; appointmentType?: string; maxSlots?: number },
): Promise<{ slots: Slot[]; daysChecked: string[]; calendarBusyUnavailable: boolean }> {
  const { config, client } = context;
  const timeZone = config.businessIdentity.timezone;
  const durationMinutes = appointmentDurationMinutes(config, options.appointmentType);
  const bufferMinutes = config.calendarAndDispatch.travelBufferMinutes ?? 0;
  const stepMs = (durationMinutes + bufferMinutes) * 60_000;
  const durationMs = durationMinutes * 60_000;
  const bufferMs = bufferMinutes * 60_000;
  const crewSize = config.calendarAndDispatch.concurrentJobs ?? 1;
  const maxSlots = options.maxSlots ?? 3;
  // How soon a tech can actually be there. Offering a slot an hour out across
  // a whole metro is a promise the crew can't keep.
  const leadMinutes = config.calendarAndDispatch.minimumLeadTimeMinutes ?? 60;
  const earliestStart = new Date(Date.now() + leadMinutes * 60_000);

  const today = tzDateString(new Date(), timeZone);
  const firstDay = options.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(options.preferredDate) && options.preferredDate >= today
    ? options.preferredDate
    : today;
  // A shop booked two weeks out looks broken when the agent can only see 7 days.
  const horizonDays = config.calendarAndDispatch.bookingHorizonDays ?? 14;
  const days = Array.from({ length: horizonDays }, (_, index) => addDays(firstDay, index));

  const windowStart = zonedTimeToUtc(days[0], "00:00", timeZone) ?? new Date();
  const windowEnd = zonedTimeToUtc(addDays(days[days.length - 1], 1), "00:00", timeZone) ?? new Date(Date.now() + 8 * 86_400_000);
  const connection = await getActiveCalendarConnection(client.id);
  const conflicts = await loadConflicts(client.id, windowStart, windowEnd, config, connection);

  const holidays = new Set(config.locationsAndHours.holidays.map((holiday) => holiday.date));
  const slots: Slot[] = [];

  for (const day of days) {
    if (slots.length >= maxSlots) break;
    if (holidays.has(day)) continue;

    const ranges = config.locationsAndHours.normalHours[tzWeekday(day, timeZone)] ?? [];
    for (const range of ranges) {
      const open = zonedTimeToUtc(day, range.open, timeZone);
      const close = zonedTimeToUtc(day, range.close, timeZone);
      if (!open || !close || close <= open) continue;

      for (let start = open.getTime(); start + durationMs <= close.getTime(); start += stepMs) {
        if (slots.length >= maxSlots) break;
        if (start < earliestStart.getTime()) continue;

        const end = start + durationMs;
        // Count how many jobs already overlap rather than rejecting on the
        // first: a shop with three trucks can run three jobs at once.
        const overlapping = conflicts.filter(
          (conflict) => start < conflict.endsAt.getTime() + bufferMs && end > conflict.startsAt.getTime() - bufferMs,
        ).length;
        if (overlapping >= crewSize) continue;

        slots.push({
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
          spoken: spokenSlot(new Date(start), timeZone),
        });
      }
    }
  }

  return { slots, daysChecked: days, calendarBusyUnavailable: conflicts.calendarBusyUnavailable === true };
}

/* --------------------------------- handlers ------------------------------- */

const clientContext: AgentToolHandler = async ({ config, payload }) => {
  const { businessIdentity, aiVoice, locationsAndHours, calendarAndDispatch, receptionistBrain, servicesAndPricing, urgencyAndEscalation, complianceAndPolicies } = config;
  const nowStatus = businessOpenNow(config);
  const callerPhone = callerIdPhone(payload);

  return {
    ok: true,
    message: `Our live rules are loaded. It is ${nowStatus.localTime} here at the shop and we are ${nowStatus.isOpen ? "open" : "closed"} right now.${callerPhone ? ` They are calling from ${callerPhone}, so check that number rather than making them dictate one.` : ""} Everything in this result is our own information: hours, prices, payment, coverage. Say all of it as ours, in the first person. Never invent a price, an opening or a promise beyond what is here.`,
    data: {
      now: {
        localTime: nowStatus.localTime,
        isOpen: nowStatus.isOpen,
        isHoliday: nowStatus.isHoliday,
        todaysHours: nowStatus.todaysHours,
      },
      callerPhone,
      businessName: businessIdentity.publicName,
      industry: businessIdentity.industry,
      timezone: businessIdentity.timezone,
      receptionistName: aiVoice.receptionistName,
      greetingScript: aiVoice.greetingScript,
      disclosurePhrase: aiVoice.disclosurePhrase,
      ownerName: businessIdentity.ownerName,
      bookingMode: calendarAndDispatch.bookingMode,
      appointmentWindowWording: calendarAndDispatch.appointmentWindowWording,
      noAvailabilityBehavior: calendarAndDispatch.noAvailabilityBehavior,
      businessHours: locationsAndHours.normalHours,
      serviceAreas: locationsAndHours.serviceAreas,
      outOfAreaResponse: locationsAndHours.outOfAreaResponse,
      activeServices: servicesAndPricing.services
        .filter((service) => service.active)
        .map((service) => ({
          name: service.name,
          description: service.description,
          requiredQuestions: service.requiredQuestions,
          priceRange: service.priceRangeCents
            ? `${formatCents(service.priceRangeCents.min)} to ${formatCents(service.priceRangeCents.max)}`
            : service.startingPriceCents
              ? `starting at ${formatCents(service.startingPriceCents)}`
              : null,
        })),
      diagnosticFees: servicesAndPricing.diagnosticFees.map((fee) => ({ label: fee.label, amount: formatCents(fee.amountCents) })),
      quoteGuardrails: servicesAndPricing.quoteGuardrails,
      neverQuoteConditions: servicesAndPricing.neverQuoteConditions,
      // Work the shop refuses. Booking one of these costs a wasted truck roll,
      // so the agent needs it on every call, not just in the prompt.
      doNotBook: config.qualificationRules.doNotBookConditions,
      requiredIntakeFields: receptionistBrain.requiredIntakeFields,
      wordsToAvoid: receptionistBrain.wordsToAvoid,
      forbiddenClaims: receptionistBrain.forbiddenClaims,
      lowConfidencePolicy: receptionistBrain.lowConfidencePolicy,
      urgentTriggers: urgencyAndEscalation.urgentTriggers,
      paymentInfoPolicy: complianceAndPolicies.paymentInfoPolicy,
    },
  };
};

const serviceAreaInput = z.object({
  // Free-form: whatever the caller said when asked where they are. This is the
  // field the agent is steered toward, so it never has to say "city or ZIP"
  // out loud. city/zip/address stay accepted because the model still fills
  // them when it already knows the answer from earlier in the call.
  location: optionalText,
  city: optionalText,
  zip: optionalText,
  address: optionalText,
});

const serviceArea: AgentToolHandler = async ({ config, payload }) => {
  const input = serviceAreaInput.safeParse(payload);
  if (!input.success) return askAgainResult("You do not have their location yet. Ask where they are, the way a person would, and send back whatever they say - a town, a ZIP, or a street address all work.");

  const { city, zip, address, location } = input.data;
  const freeForm = location ?? address;
  // Callers answer "where are you?" however they feel like - a town, a ZIP, a
  // street address, a landmark - and the model drops that answer into whichever
  // parameter it thinks fits. Scan every field for both kinds of location
  // instead of trusting the parameter names. Previously only zip and address
  // were scanned for digits, so a caller who just said "84070" had it compared
  // against the configured TOWN names and never matched.
  const zipFromCity = city?.match(/\b\d{5}\b/)?.[0];
  // In a US address the ZIP comes last and the house number comes first, so
  // drop a leading number before looking - otherwise "12345 S Redwood Rd"
  // reads as ZIP 12345.
  const zipFromFreeForm = freeForm?.replace(/^\s*\d+\s/, "").match(/\b\d{5}\b/g)?.pop();
  const effectiveZip = zip?.match(/\d{5}/)?.[0] ?? zipFromCity ?? zipFromFreeForm;
  const effectiveCity = city ?? freeForm;

  if (!effectiveZip && !effectiveCity) {
    return askAgainResult("You do not have their location yet. Ask where they are, the way a person would, and send back whatever they say - a town, a ZIP, or a street address all work.");
  }

  const areas = config.locationsAndHours.serviceAreas;
  if (areas.length === 0) {
    return {
      ok: true,
      message: "You do not have our coverage list on this call, so do not confirm or rule out coverage either way. Take where they are and their details, and tell them somebody will call straight back to confirm.",
      data: { inServiceArea: null, checkedCity: effectiveCity ?? null, checkedZip: effectiveZip ?? null },
    };
  }

  const cityNormalized = effectiveCity?.toLowerCase().trim();
  const matched = areas.find((area) => {
    if (effectiveZip && area.zip && area.zip.trim() === effectiveZip) return true;
    if (cityNormalized && area.city) {
      const areaCity = area.city.toLowerCase().trim();
      return areaCity === cityNormalized || areaCity.includes(cityNormalized) || cityNormalized.includes(areaCity);
    }
    return false;
  });

  if (matched) {
    return {
      ok: true,
      message: "The caller is inside the service area. Continue with intake and scheduling.",
      data: { inServiceArea: true, matchedArea: matched, checkedCity: effectiveCity ?? null, checkedZip: effectiveZip ?? null },
    };
  }

  // Not on the list is not the same as not covered — the list is typed by hand
  // and misses neighbouring towns, spellings and new suburbs. A false "we
  // don't serve you" loses a job that was never out of range, while "let me
  // check" costs nothing, so this stays deliberately soft.
  return {
    ok: true,
    message: `${effectiveCity ?? effectiveZip} is not on our list of towns, but that list is typed by hand and misses places we do cover, so do NOT tell the caller we do not serve them and do NOT hedge at length. Say you want to make sure we can get a truck out that far, take their name, number, address and what they need, save the lead, and tell them we will call them straight back on it. Say all of that as us.`,
    data: { inServiceArea: null, notOnConfiguredList: true, configuredAreas: areas, checkedCity: effectiveCity ?? null, checkedZip: effectiveZip ?? null, ownerGuidance: config.locationsAndHours.outOfAreaResponse },
  };
};

const classifyUrgencyInput = z.object({
  issue: optionalText,
  issueDescription: optionalText,
  vehicleTrapped: looseBoolean,
  afterHours: looseBoolean,
});

const classifyUrgency: AgentToolHandler = async ({ config, payload }) => {
  const input = classifyUrgencyInput.safeParse(payload);
  const issue = input.success ? input.data.issue ?? input.data.issueDescription : undefined;
  if (!issue) return askAgainResult("Describe the caller's issue in the issue field, then classify urgency again.");

  const issueLower = issue.toLowerCase();
  const matchedTriggers = config.urgencyAndEscalation.urgentTriggers.filter((trigger) => {
    const triggerLower = trigger.toLowerCase();
    if (issueLower.includes(triggerLower)) return true;
    const words = triggerLower.split(/\s+/).filter((word) => word.length > 2);
    return words.length > 0 && words.every((word) => issueLower.includes(word));
  });

  const vehicleTrapped = input.success ? input.data.vehicleTrapped === true : false;
  // After-hours is a fact about the clock, not a judgment call — the server
  // computes it from the business's own hours instead of trusting the agent.
  const afterHours = !businessOpenNow(config).isOpen;
  const urgency = matchedTriggers.length > 0 || vehicleTrapped ? "high" : afterHours ? "medium" : "low";

  const messages = {
    high: "Move fast on this one. Offer the soonest opening we have, and if nothing works, send an owner alert or transfer per our rules. How you rated this call is for you and never something you say out loud: talk about the actual thing that is wrong instead.",
    medium: "Offer the soonest reasonable opening we have and collect full callback details. How you rated this call is for you and never something you say out loud.",
    low: "Nothing special here. Continue normal intake and scheduling.",
  } as const;


  return {
    ok: true,
    message: messages[urgency],
    data: {
      urgency,
      matchedTriggers,
      vehicleTrapped,
      afterHours,
      operatorReviewThreshold: config.urgencyAndEscalation.operatorReviewThreshold,
    },
  };
};

const availabilityInput = z.object({
  preferredDate: optionalText,
  appointmentType: optionalText,
});

const calendarAvailability: AgentToolHandler = async (context) => {
  const input = availabilityInput.safeParse(context.payload);
  const options = input.success ? input.data : {};

  const { slots, daysChecked, calendarBusyUnavailable } = await generateAvailability(context, options);

  if (slots.length === 0) {
    return {
      ok: true,
      message: `We have nothing open in the next ${daysChecked.length} days. Ask what days would work for them, take their details, and alert the owner.`,
      data: { slots: [], daysChecked },
    };
  }

  // We could not read the real calendar, so these times come from opening
  // hours alone and the crew may already be out on some of them. Offer them,
  // but don't let the agent promise the slot is locked in.
  if (calendarBusyUnavailable) {
    return {
      ok: true,
      message: "These times come from our opening hours only, so they may already be taken. Offer one at a time and say somebody will confirm the exact time shortly rather than promising it outright. Give the time as when we will get there, give or take, and not as a promise to the minute.",
      data: { slots, timezone: context.config.businessIdentity.timezone, calendarChecked: false },
    };
  }

  return {
    ok: true,
    message: "Offer these openings one at a time, using the spoken label. Give the time as when we will get there, give or take, and not as a promise to the minute.",
    data: { slots, timezone: context.config.businessIdentity.timezone, calendarChecked: true },
  };
};

const bookingInput = z.object({
  startsAt: optionalText,
  callerName: optionalText,
  callerPhone: optionalText,
  address: optionalText,
  serviceAddress: optionalText,
  email: optionalText,
  urgency: optionalText,
  serviceSummary: optionalText,
  issue: optionalText,
  appointmentType: optionalText,
});

/**
 * The booking-time backstop. The agent is told to verify before the recap, but
 * a model can skip a step, so booking re-checks rather than trusting it.
 * Reuses the answer from earlier in the same call when the address has not
 * changed, so a normal booking costs one API call, not two.
 *
 * This never blocks and never returns early. The owner's goal is to stop trucks
 * being sent into the void, and that is a dispatch problem, not a booking
 * problem: there is a human between the booking and the truck, so flagging the
 * job is what actually prevents the wasted drive. Refusing the booking would
 * just convert a fixable data problem into a lost customer.
 */
async function resolveAddressVerification(
  conversationId: string | null,
  address: string | undefined,
): Promise<AddressVerification | null> {
  if (!address) return null;
  if (conversationId) {
    try {
      const db = getDb();
      const [prior] = await db
        .select({ request: agentToolCalls.requestPayload, response: agentToolCalls.responsePayload })
        .from(agentToolCalls)
        .where(and(
          eq(agentToolCalls.toolName, "address/verify"),
          sql`${agentToolCalls.requestPayload}->>'conversation_id' = ${conversationId}`,
        ))
        .orderBy(desc(agentToolCalls.createdAt))
        .limit(1);
      const priorAddress = typeof prior?.request?.address === "string" ? prior.request.address : null;
      const priorData = (prior?.response as { data?: Record<string, unknown> } | undefined)?.data;
      if (priorAddress && priorAddress.trim() === address.trim() && priorData?.status) {
        const status = priorData.status as AddressVerification["status"];
        if (status === "confirmed" || status === "corrected") {
          return {
            status,
            normalizedAddress: String(priorData.normalizedAddress ?? address),
            spokenAddress: String(priorData.spokenAddress ?? address),
            dpv: null,
          };
        }
        return { status: "unverified", reason: (priorData.reason as "error") ?? "error" };
      }
    } catch {
      // fall through to a fresh check
    }
  }
  return verifyServiceAddress(address);
}

const addressVerifyInput = z.object({
  address: optionalText,
  serviceAddress: optionalText,
});

/**
 * How many times we already checked an address on THIS call. Counted from the
 * tool-call log rather than trusted to the model, so the agent cannot be talked
 * into interrogating a customer about their own address in a loop.
 */
async function priorAddressChecks(conversationId: string | null): Promise<number> {
  if (!conversationId) return 0;
  try {
    const db = getDb();
    const rows = await db
      .select({ id: agentToolCalls.id })
      .from(agentToolCalls)
      .where(and(
        eq(agentToolCalls.toolName, "address/verify"),
        sql`${agentToolCalls.requestPayload}->>'conversation_id' = ${conversationId}`,
      ));
    return rows.length;
  } catch {
    // Never let bookkeeping break a booking.
    return 0;
  }
}

const addressVerify: AgentToolHandler = async (context) => {
  const input = addressVerifyInput.safeParse(context.payload);
  const address = input.success ? (input.data.address ?? input.data.serviceAddress) : undefined;
  if (!address) {
    return askAgainResult("You do not have their street address yet. Ask for it, then check it.");
  }

  const [verification, priorChecks] = await Promise.all([
    verifyServiceAddress(address),
    priorAddressChecks(context.conversationId),
  ]);

  if (verification.status === "confirmed") {
    return {
      ok: true,
      message: "That address checks out. Carry on to the recap and say it back the way they gave it.",
      data: { status: "confirmed", spokenAddress: verification.spokenAddress, normalizedAddress: verification.normalizedAddress },
    };
  }

  if (verification.status === "corrected") {
    return {
      ok: true,
      // The recap is mandatory and already contains the address, so a
      // correction costs zero extra turns: the caller simply hears the right
      // version and confirms it, never knowing anything was checked.
      message: `That address is real, with a small correction. In your recap say the address exactly like this: ${verification.spokenAddress}. Do not mention that you checked it or that anything was corrected. Just say it that way and let them confirm it.`,
      data: { status: "corrected", spokenAddress: verification.spokenAddress, normalizedAddress: verification.normalizedAddress },
    };
  }

  // Unverified. This is NOT a rejection. Plenty of real addresses land here:
  // new builds that are not in the postal file yet, rural highway addresses,
  // apartments without a unit number. One extra check, then book regardless.
  if (priorChecks === 0 && verification.reason !== "disabled") {
    return {
      ok: true,
      message: "That one did not come back as findable. It may be a new build or a rural road, or a digit may have been misheard. Do NOT tell the caller anything failed or that their address is invalid. Say the address back in your recap the way they gave it to you, at normal speed, so they can catch a wrong digit themselves. Then book it either way.",
      data: { status: "unverified", reason: verification.reason, attempt: 1 },
    };
  }

  return {
    ok: true,
    message: "Still not findable, and that is fine — plenty of real addresses never come up. Do not ask about it again. Recap it exactly as they gave it and book normally.",
    data: { status: "unverified", reason: verification.reason, attempt: priorChecks + 1 },
  };
};

async function createAppointment(context: AgentToolContext, kind: "hold" | "book"): Promise<AgentToolResult> {
  const input = bookingInput.safeParse(context.payload);
  if (!input.success || !input.data.startsAt) {
    return askAgainResult("Pass the chosen slot's startsAt value from the availability check, plus the caller's name and phone number.");
  }

  const address = input.data.address ?? input.data.serviceAddress;
  const callerPhone = input.data.callerPhone ?? callerIdPhone(context.payload) ?? undefined;
  if (kind === "book" && (!input.data.callerName || !callerPhone || !address)) {
    return askAgainResult("Before booking, collect the caller's name, callback phone number, and the full service address, then book again with all three.");
  }

  const { config, client } = context;
  const bookingMode = config.calendarAndDispatch.bookingMode;

  const addressCheck = kind === "book" ? await resolveAddressVerification(context.conversationId, address) : null;
  const addressUnverified = addressCheck?.status === "unverified";
  const dispatchAddress = addressCheck && addressCheck.status !== "unverified" ? addressCheck.normalizedAddress : address;

  if (kind === "book" && bookingMode === "lead_only") {
    return {
      ok: true,
      message: "We take details for the owner instead of booking straight into the calendar. Save the lead, tell the caller the owner will confirm the time, and do not promise a slot.",
      data: { booked: false, reason: "lead_only" },
    };
  }

  const startsAt = new Date(input.data.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) {
    return askAgainResult("That start time is not valid. Re-check availability and pass an upcoming slot's startsAt value.");
  }

  const durationMinutes = appointmentDurationMinutes(config, input.data.appointmentType);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  const connection = await getActiveCalendarConnection(client.id);
  const conflicts = await loadConflicts(client.id, startsAt, endsAt, config, connection);
  // Full only when every truck is already out.
  if (conflicts.length >= (config.calendarAndDispatch.concurrentJobs ?? 1)) {
    return {
      ok: true,
      message: "That time was just taken. Re-check availability and offer the caller another opening.",
      data: { booked: false, reason: "conflict" },
    };
  }

  const status = kind === "hold"
    ? bookingMode === "owner_approval" ? "needs_approval" : "held"
    : bookingMode === "owner_approval" ? "needs_approval" : "booked";

  const db = getDb();
  const [appointment] = await db.insert(appointments).values({
    clientId: client.id,
    calendarConnectionId: connection?.id ?? null,
    callerName: input.data.callerName,
    callerPhone: callerPhone ? normalizePhone(callerPhone) : null,
    serviceSummary: input.data.serviceSummary ?? input.data.issue,
    startsAt,
    endsAt,
    status,
    metadata: {
      source: "agent_tool",
      kind,
      bookingMode,
      serviceAddress: address ?? null,
      callerEmail: input.data.email ?? null,
      urgency: input.data.urgency ?? null,
      conversationId: context.conversationId,
      configVersionId: context.configVersionId,
      ...(addressCheck ? { addressVerification: { status: addressCheck.status, ...(addressCheck.status === "unverified" ? { reason: addressCheck.reason } : { normalizedAddress: addressCheck.normalizedAddress }), checkedAt: new Date().toISOString() } } : {}),
      ...(kind === "hold" ? { holdExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString() } : {}),
    },
  }).returning();

  const spoken = spokenSlot(startsAt, config.businessIdentity.timezone);

  // Confirmed bookings land on the real calendar when one is connected. The
  // event is the technician's job sheet: what, where, and how to reach them.
  let calendarSyncFailed = false;
  if (status === "booked" && connection) {
    const summaryLine = input.data.serviceSummary ?? input.data.issue ?? "Service appointment";
    const event = await createCalendarEvent(connection, {
      summary: `${summaryLine} — ${input.data.callerName ?? "caller"} (Bellory)`,
      description: [
        // First line, so it is visible on a phone without expanding the event.
        addressUnverified ? "** ADDRESS NOT VERIFIED - confirm with the customer before dispatch **" : null,
        input.data.callerName ? `Customer: ${input.data.callerName}` : null,
        callerPhone ? `Phone: ${normalizePhone(callerPhone)}` : null,
        input.data.email ? `Email: ${input.data.email}` : null,
        address ? `Address: ${address}` : null,
        input.data.issue ? `Issue: ${input.data.issue}` : null,
        input.data.urgency ? `Urgency: ${input.data.urgency}` : null,
        "",
        "Booked by the Bellory receptionist. Contact the customer directly with any questions.",
      ].filter((line) => line !== null).join("\n"),
      location: dispatchAddress,
      startsAt,
      endsAt,
      timeZone: config.businessIdentity.timezone,
      // Google emails the owner and pushes it to their phone. Without this a
      // booked job is a silent row on a calendar nobody is watching.
      notifyEmails: [config.businessIdentity.ownerEmail].filter((email): email is string => Boolean(email)),
    });

    await db.update(appointments)
      .set(event
        ? { externalEventId: event.eventId, metadata: { ...appointment.metadata, htmlLink: event.htmlLink }, updatedAt: new Date() }
        : { metadata: { ...appointment.metadata, calendarSyncError: true }, updatedAt: new Date() })
      .where(eq(appointments.id, appointment.id));

    // A booking that never reaches the owner's calendar is invisible to the
    // crew, so it must surface in the admin instead of failing silently.
    if (!event) {
      calendarSyncFailed = true;
      await db.insert(clientIssues).values({
        organizationId: client.organizationId,
        clientId: client.id,
        severity: "high",
        status: "open",
        source: "agent_tools",
        title: "Booked appointment missing from calendar",
        description: `${input.data.callerName ?? "A caller"} (${normalizePhone(callerPhone ?? "")}) booked ${spoken}, but the Google Calendar event could not be created. Add it to the calendar manually and check the calendar connection.`,
        actionLabel: "Review appointments",
        metadata: { appointmentId: appointment.id },
      });
    }
  }

  // Medium, not high: rural and new-build addresses will generate these
  // routinely, and a high-severity alarm nobody can act on gets ignored, which
  // then buries the real ones.
  if (status === "booked" && addressUnverified) {
    await db.insert(clientIssues).values({
      organizationId: client.organizationId,
      clientId: client.id,
      severity: "medium",
      status: "open",
      source: "agent_tools",
      title: "Appointment booked with an unverified address",
      description: `${input.data.callerName ?? "A caller"} (${normalizePhone(callerPhone ?? "")}) booked ${spoken} at "${address}", which did not come back as a findable address. It may be a new build, a rural road, or a misheard digit. Confirm it with the customer before sending a truck.`,
      actionLabel: "Review appointments",
      metadata: { appointmentId: appointment.id, address: address ?? null },
    });
  }

  // The agent promises callers a confirmation text, so one actually goes out
  // the moment the appointment lands. Failures never break the call — they're
  // recorded on the appointment and surfaced as an admin issue.
  let confirmationTexted = false;
  if ((status === "booked" || status === "needs_approval") && callerPhone) {
    const businessName = config.businessIdentity.publicName;
    const textBody = status === "booked"
      ? [
        `${businessName}: you're booked for ${spoken}${address ? ` at ${address}` : ""}.`,
        input.data.serviceSummary ?? input.data.issue ?? null,
        "Reply or call this number if anything changes.",
      ].filter(Boolean).join(" ")
      : `${businessName}: got your request for ${spoken}. We'll text you shortly to confirm the exact time.`;

    const sent = await sendSms({ to: callerPhone, body: textBody, from: clientSmsFrom(config) });
    confirmationTexted = sent.ok;
    await db.update(appointments)
      .set({
        metadata: {
          ...appointment.metadata,
          confirmationSms: sent.ok ? { sid: sent.sid, sentAt: new Date().toISOString() } : { error: sent.error, failedAt: new Date().toISOString() },
        },
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointment.id));

    if (!sent.ok && !sent.disabled && status === "booked") {
      await db.insert(clientIssues).values({
        organizationId: client.organizationId,
        clientId: client.id,
        severity: "medium",
        status: "open",
        source: "notifications",
        title: "Booking confirmation text failed to send",
        description: `${input.data.callerName ?? "A caller"} booked ${spoken} but the confirmation SMS to ${callerPhone} failed: ${sent.error}`,
        actionLabel: "Text the customer manually",
        metadata: { appointmentId: appointment.id },
      });
    }
  }

  const confirmationLine = confirmationTexted
    ? " Tell them a confirmation text just went to their number."
    : "";
  const messages: Record<string, string> = {
    booked: calendarSyncFailed
      // The job is in our database but not on the crew's board. Don't let the
      // caller hang up believing it is fully locked in — say someone will
      // confirm, so a dropped job surfaces as a follow-up call rather than a
      // no-show.
      ? `The ${spoken} appointment is recorded but it did NOT reach our calendar. Tell the caller you have them down for ${spoken} and that somebody will call shortly to confirm it. Do not say it is fully confirmed. Send bellory_send_owner_alert with the appointment details so one of us gets it onto the schedule, and save the lead with this appointmentId.${confirmationLine}`
      : `Booked for ${spoken}. Say the time back once, as when we will get there rather than a promise to the minute, then save the lead with this appointmentId. They already agreed to the rest in the recap, so do not repeat their name, address or number.${confirmationLine}`,
    needs_approval: `The request for ${spoken} is recorded and waiting on owner approval. Tell the caller the time will be confirmed shortly, and save the lead with this appointmentId.`,
    held: `The ${spoken} slot is held for 30 minutes. Confirm details with the caller, then book it.`,
  };

  return {
    ok: true,
    message: messages[status],
    data: {
      appointmentId: appointment.id,
      status,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      spoken,
      ...(status === "booked" ? { calendarSynced: !calendarSyncFailed } : {}),
    },
  };
}

const calendarHold: AgentToolHandler = (context) => createAppointment(context, "hold");
const calendarBook: AgentToolHandler = (context) => createAppointment(context, "book");

const leadInput = z.object({
  phone: optionalText,
  callerPhone: optionalText,
  name: optionalText,
  callerName: optionalText,
  address: optionalText,
  serviceAddress: optionalText,
  email: optionalText,
  issue: optionalText,
  urgency: optionalText,
  status: optionalText,
  summary: optionalText,
  appointmentId: optionalText,
  estimatedValueCents: z.coerce.number().int().nonnegative().optional(),
});

const leadStatuses = ["new", "qualifying", "needs_owner", "booked", "lost", "spam"] as const;
const urgencyLevels = ["low", "medium", "high"] as const;

const leadsUpsert: AgentToolHandler = async (context) => {
  const input = leadInput.safeParse(context.payload);
  const phoneRaw = (input.success ? input.data.phone ?? input.data.callerPhone : undefined) ?? callerIdPhone(context.payload);
  if (!input.success || !phoneRaw) {
    return askAgainResult("Ask the caller for a callback phone number, then save the lead again.");
  }

  const data = input.data;
  const phone = normalizePhone(phoneRaw);
  const urgency = urgencyLevels.find((level) => level === data.urgency?.toLowerCase());
  const status = leadStatuses.find((candidate) => candidate === data.status?.toLowerCase());
  const contactDetails = {
    ...(data.address ?? data.serviceAddress ? { serviceAddress: data.address ?? data.serviceAddress } : {}),
    ...(data.email ? { email: data.email } : {}),
  };
  const db = getDb();

  const [existing] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.clientId, context.client.id), eq(leads.phone, phone)))
    .orderBy(desc(leads.createdAt))
    .limit(1);

  const fields = {
    name: data.name ?? data.callerName,
    issue: data.issue,
    summary: data.summary,
    appointmentId: data.appointmentId,
    estimatedValueCents: data.estimatedValueCents,
    ...(urgency ? { urgency } : {}),
    ...(status ? { status } : {}),
    ...(context.callId ? { callId: context.callId } : {}),
  };
  const definedFields = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

  if (existing) {
    const [updated] = await db
      .update(leads)
      .set({ ...definedFields, metadata: { ...existing.metadata, ...contactDetails }, updatedAt: new Date() })
      .where(eq(leads.id, existing.id))
      .returning();

    return {
      ok: true,
      message: "Lead updated. Confirm the callback number with the caller before ending the call.",
      data: { leadId: updated.id, created: false, status: updated.status },
    };
  }

  const [created] = await db.insert(leads).values({
    clientId: context.client.id,
    phone,
    ...definedFields,
    metadata: { source: "agent_tool", conversationId: context.conversationId, ...contactDetails },
  }).returning();

  return {
    ok: true,
    message: "Lead saved. Confirm the callback number with the caller before ending the call.",
    data: { leadId: created.id, created: true, status: created.status },
  };
};

const ownerAlertInput = z.object({
  reason: optionalText,
  issue: optionalText,
  callerPhone: optionalText,
  callerName: optionalText,
  urgency: optionalText,
  leadId: optionalText,
  channel: optionalText,
});

const ownerAlert: AgentToolHandler = async (context) => {
  const input = ownerAlertInput.safeParse(context.payload);
  const reason = input.success ? input.data.reason ?? input.data.issue : undefined;
  if (!input.success || !reason) {
    return askAgainResult("Include a short reason describing the caller's situation, then send the owner alert again.");
  }

  const { config, client } = context;
  const data = input.data;
  const rendered = config.urgencyAndEscalation.smsAlertTemplate
    .replaceAll("{{client_name}}", config.businessIdentity.publicName)
    .replaceAll("{{issue}}", data.issue ?? reason)
    .replaceAll("{{caller_phone}}", data.callerPhone ? normalizePhone(data.callerPhone) : "no callback number yet");
  const body = data.urgency?.toLowerCase() === "high" ? `URGENT: ${rendered}` : rendered;

  const db = getDb();
  const [notification] = await db.insert(ownerNotifications).values({
    clientId: client.id,
    leadId: data.leadId,
    callId: context.callId,
    channel: "sms",
    recipient: config.businessIdentity.ownerPhone,
    status: "queued",
    body,
  }).returning();

  // Deliver immediately — an urgent alert sitting in a queue nobody reads is
  // worse than no alert feature at all. While SMS is deliberately disabled
  // (pre-A2P registration) the row stays queued for the day it ships, without
  // raising a false alarm.
  const sent = await sendSms({ to: config.businessIdentity.ownerPhone, body, from: clientSmsFrom(config) });
  if (!(!sent.ok && sent.disabled)) {
    await db.update(ownerNotifications)
      .set(sent.ok ? { status: "sent", sentAt: new Date(), updatedAt: new Date() } : { status: "failed", updatedAt: new Date() })
      .where(eq(ownerNotifications.id, notification.id));
  }

  if (!sent.ok && !sent.disabled) {
    // The owner did NOT get the text — someone must see this in the admin.
    await db.insert(clientIssues).values({
      organizationId: client.organizationId,
      clientId: client.id,
      severity: "critical",
      status: "open",
      source: "notifications",
      title: "Urgent owner alert SMS failed to send",
      description: `Alert for ${config.businessIdentity.ownerName} (${config.businessIdentity.ownerPhone}) was not delivered: ${sent.error}. Alert text: ${body}`,
      actionLabel: "Contact the owner manually",
      metadata: { notificationId: notification.id },
    });
  }

  return {
    ok: true,
    message: sent.ok
      ? `Alert texted to ${config.businessIdentity.ownerName}. Tell the caller their details have been passed along for follow-up.`
      : `Saved here for the owner to see. Tell the caller their details are with us and somebody will follow up.`,
    data: { notificationId: notification.id, channel: notification.channel, status: sent.ok ? "sent" : "failed" },
  };
};

/* ------------------------- existing appointments -------------------------- */

const lookupInput = z.object({
  phone: optionalText,
  callerPhone: optionalText,
});

const appointmentsLookup: AgentToolHandler = async (context) => {
  const input = lookupInput.safeParse(context.payload);
  const phoneRaw = (input.success ? input.data.phone ?? input.data.callerPhone : undefined) ?? callerIdPhone(context.payload);
  if (!phoneRaw) return askAgainResult("Ask the caller for the phone number the appointment was booked under, then look it up again.");

  const db = getDb();
  const rows = await db
    .select()
    .from(appointments)
    .where(and(
      eq(appointments.clientId, context.client.id),
      eq(appointments.callerPhone, normalizePhone(phoneRaw)),
      inArray(appointments.status, ["held", "booked", "needs_approval"]),
      gt(appointments.startsAt, new Date()),
    ))
    .orderBy(asc(appointments.startsAt))
    .limit(5);

  if (rows.length === 0) {
    return {
      ok: true,
      message: "Nothing upcoming on that number. Check the number once with the caller; if it still finds nothing, save their details as a lead and alert the owner so somebody here can sort it out.",
      data: { appointments: [] },
    };
  }

  const timeZone = context.config.businessIdentity.timezone;
  return {
    ok: true,
    message: rows.length === 1
      ? "Found one upcoming appointment. Confirm the name on it matches the caller before changing anything."
      : "Found several upcoming appointments. Confirm which one the caller means and that the name matches.",
    data: {
      appointments: rows.map((row) => ({
        appointmentId: row.id,
        spoken: spokenSlot(row.startsAt, timeZone),
        startsAt: row.startsAt.toISOString(),
        service: row.serviceSummary,
        nameOnAppointment: row.callerName,
        status: row.status,
      })),
    },
  };
};

const rescheduleInput = z.object({
  appointmentId: optionalText,
  newStartsAt: optionalText,
  startsAt: optionalText,
});

const appointmentsReschedule: AgentToolHandler = async (context) => {
  const input = rescheduleInput.safeParse(context.payload);
  const appointmentId = input.success ? input.data.appointmentId : undefined;
  const newStartRaw = input.success ? input.data.newStartsAt ?? input.data.startsAt : undefined;
  if (!appointmentId || !newStartRaw) {
    return askAgainResult("Pass the appointment_id from bellory_find_appointments and the new slot's startsAt from bellory_check_availability.");
  }

  const db = getDb();
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.clientId, context.client.id)))
    .limit(1);
  if (!appointment || !["held", "booked", "needs_approval"].includes(appointment.status)) {
    return askAgainResult("That appointment could not be found or is no longer active. Look it up again with bellory_find_appointments.");
  }

  const newStartsAt = new Date(newStartRaw);
  if (Number.isNaN(newStartsAt.getTime()) || newStartsAt.getTime() < Date.now()) {
    return askAgainResult("That new start time is not valid. Check availability again and pass an upcoming slot's startsAt value.");
  }

  const durationMs = appointment.endsAt.getTime() - appointment.startsAt.getTime();
  const newEndsAt = new Date(newStartsAt.getTime() + durationMs);
  const { config, client } = context;

  const connection = await getActiveCalendarConnection(client.id);
  const conflicts = await loadConflicts(client.id, newStartsAt, newEndsAt, config, connection, appointment.id);
  if (conflicts.length > 0) {
    return {
      ok: true,
      message: "That new time is already taken. Re-check availability and offer the caller another opening.",
      data: { rescheduled: false, reason: "conflict" },
    };
  }

  await db.update(appointments).set({
    startsAt: newStartsAt,
    endsAt: newEndsAt,
    metadata: {
      ...appointment.metadata,
      rescheduledFrom: appointment.startsAt.toISOString(),
      rescheduledAt: new Date().toISOString(),
      rescheduleConversationId: context.conversationId,
    },
    updatedAt: new Date(),
  }).where(eq(appointments.id, appointment.id));

  let calendarMoved = true;
  if (appointment.externalEventId && connection) {
    calendarMoved = await updateCalendarEventTime(connection, appointment.externalEventId, {
      startsAt: newStartsAt,
      endsAt: newEndsAt,
      timeZone: config.businessIdentity.timezone,
    });
    if (!calendarMoved) {
      await db.update(appointments)
        .set({ metadata: { ...appointment.metadata, calendarSyncError: true }, updatedAt: new Date() })
        .where(eq(appointments.id, appointment.id));
    }
  }

  const spoken = spokenSlot(newStartsAt, config.businessIdentity.timezone);

  if (appointment.callerPhone) {
    await sendSms({
      to: appointment.callerPhone,
      body: `${config.businessIdentity.publicName}: your appointment has been moved to ${spoken}. Reply or call this number if that doesn't work.`,
      from: clientSmsFrom(config),
    });
  }

  return {
    ok: true,
    message: `Moved to ${spoken}. Say the new time back to the caller once, as when we will get there rather than a promise to the minute.`,
    data: { rescheduled: true, appointmentId: appointment.id, startsAt: newStartsAt.toISOString(), endsAt: newEndsAt.toISOString(), spoken, calendarMoved },
  };
};

const cancelInput = z.object({
  appointmentId: optionalText,
  reason: optionalText,
});

const appointmentsCancel: AgentToolHandler = async (context) => {
  const input = cancelInput.safeParse(context.payload);
  const appointmentId = input.success ? input.data.appointmentId : undefined;
  if (!appointmentId) {
    return askAgainResult("Pass the appointment_id from bellory_find_appointments to cancel it.");
  }

  const db = getDb();
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.clientId, context.client.id)))
    .limit(1);
  if (!appointment) {
    return askAgainResult("That appointment could not be found. Look it up again with bellory_find_appointments.");
  }
  if (appointment.status === "cancelled") {
    return { ok: true, message: "That appointment was already cancelled. Let the caller know it's taken care of.", data: { cancelled: true, appointmentId } };
  }

  await db.update(appointments).set({
    status: "cancelled",
    metadata: {
      ...appointment.metadata,
      cancelledAt: new Date().toISOString(),
      cancelReason: input.success ? input.data.reason ?? null : null,
      cancelConversationId: context.conversationId,
    },
    updatedAt: new Date(),
  }).where(eq(appointments.id, appointment.id));

  const connection = await getActiveCalendarConnection(context.client.id);
  if (appointment.externalEventId && connection) {
    await deleteCalendarEvent(connection, appointment.externalEventId);
  }

  if (appointment.callerPhone) {
    await sendSms({
      to: appointment.callerPhone,
      body: `${context.config.businessIdentity.publicName}: your appointment has been cancelled. Call or text this number anytime to book a new time.`,
      from: clientSmsFrom(context.config),
    });
  }

  return {
    ok: true,
    message: "Cancelled. Confirm it's done, and offer to book a new time whenever they're ready.",
    data: { cancelled: true, appointmentId: appointment.id },
  };
};

const transferRequest: AgentToolHandler = async ({ config, payload }) => {
  const reason = typeof payload.reason === "string" ? payload.reason : null;
  const transferNumber = resolveTransferNumber(config);

  // No safe destination means the only number we hold is the one forwarding
  // into this agent. Transferring there hands the caller back to the AI they
  // just asked to escape, so take a message instead of promising a person.
  if (!transferNumber) {
    return {
      ok: true,
      message: "There is no separate line to transfer to right now, so do NOT tell the caller you are transferring them. Apologise that you can't put them through this second, take their name, number and what they need, save the lead, and send an owner alert so someone calls them straight back.",
      data: { transferAllowed: false, reason },
    };
  }

  return {
    ok: true,
    message: `Transfer is allowed. Tell the caller in your own words that you are putting them through now, then use transfer_to_number to connect them to ${config.businessIdentity.ownerName}. If the transfer fails, take their details, save the lead, and send an owner alert instead.`,
    data: {
      transferAllowed: true,
      transferNumber,
      contactName: config.businessIdentity.ownerName,
      reason,
    },
  };
};

export const agentToolHandlers: Record<string, AgentToolHandler> = {
  "client-context": clientContext,
  "service-area": serviceArea,
  "address/verify": addressVerify,
  "classify-urgency": classifyUrgency,
  "calendar/availability": calendarAvailability,
  "calendar/hold": calendarHold,
  "calendar/book": calendarBook,
  "appointments/lookup": appointmentsLookup,
  "appointments/reschedule": appointmentsReschedule,
  "appointments/cancel": appointmentsCancel,
  "leads/upsert": leadsUpsert,
  "owner-alert": ownerAlert,
  "transfer-request": transferRequest,
};
