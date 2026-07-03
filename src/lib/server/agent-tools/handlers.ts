import { and, desc, eq, inArray, lt, gt } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { appointments, leads, ownerNotifications } from "@/db/schema";
import type { BelloryClientConfig } from "@/lib/server/config/client-config-schema";
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

async function loadConflicts(clientId: string, windowStart: Date, windowEnd: Date) {
  const db = getDb();
  return db
    .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(and(
      eq(appointments.clientId, clientId),
      inArray(appointments.status, ["held", "booked", "needs_approval"]),
      lt(appointments.startsAt, windowEnd),
      gt(appointments.endsAt, windowStart),
    ));
}

async function generateAvailability(
  context: AgentToolContext,
  options: { preferredDate?: string; appointmentType?: string; maxSlots?: number },
): Promise<{ slots: Slot[]; daysChecked: string[] }> {
  const { config, client } = context;
  const timeZone = config.businessIdentity.timezone;
  const durationMinutes = appointmentDurationMinutes(config, options.appointmentType);
  const bufferMinutes = config.calendarAndDispatch.travelBufferMinutes ?? 0;
  const stepMs = (durationMinutes + bufferMinutes) * 60_000;
  const durationMs = durationMinutes * 60_000;
  const bufferMs = bufferMinutes * 60_000;
  const maxSlots = options.maxSlots ?? 3;
  const earliestStart = new Date(Date.now() + 60 * 60_000);

  const today = tzDateString(new Date(), timeZone);
  const firstDay = options.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(options.preferredDate) && options.preferredDate >= today
    ? options.preferredDate
    : today;
  const days = Array.from({ length: 7 }, (_, index) => addDays(firstDay, index));

  const windowStart = zonedTimeToUtc(days[0], "00:00", timeZone) ?? new Date();
  const windowEnd = zonedTimeToUtc(addDays(days[days.length - 1], 1), "00:00", timeZone) ?? new Date(Date.now() + 8 * 86_400_000);
  const conflicts = await loadConflicts(client.id, windowStart, windowEnd);

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
        const overlaps = conflicts.some(
          (conflict) => start < conflict.endsAt.getTime() + bufferMs && end > conflict.startsAt.getTime() - bufferMs,
        );
        if (overlaps) continue;

        slots.push({
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
          spoken: spokenSlot(new Date(start), timeZone),
        });
      }
    }
  }

  return { slots, daysChecked: days };
}

/* --------------------------------- handlers ------------------------------- */

const clientContext: AgentToolHandler = async ({ config }) => {
  const { businessIdentity, aiVoice, locationsAndHours, calendarAndDispatch, receptionistBrain, servicesAndPricing, urgencyAndEscalation, complianceAndPolicies } = config;

  return {
    ok: true,
    message: `Live call context for ${businessIdentity.publicName} loaded. Follow these rules exactly; never invent pricing, availability, or promises beyond them.`,
    data: {
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
  city: optionalText,
  zip: optionalText,
  address: optionalText,
});

const serviceArea: AgentToolHandler = async ({ config, payload }) => {
  const input = serviceAreaInput.safeParse(payload);
  if (!input.success) return askAgainResult("Ask the caller for their city or ZIP code, then check the service area again.");

  const { city, zip, address } = input.data;
  const zipFromAddress = address?.match(/\b\d{5}\b/)?.[0];
  const effectiveZip = zip?.match(/\d{5}/)?.[0] ?? zipFromAddress;
  const effectiveCity = city ?? (address && !effectiveZip ? address : undefined);

  if (!effectiveZip && !effectiveCity) {
    return askAgainResult("Ask the caller for their city or ZIP code, then check the service area again.");
  }

  const areas = config.locationsAndHours.serviceAreas;
  if (areas.length === 0) {
    return {
      ok: true,
      message: "No service areas are configured for this business. Take the caller's location and details for owner review instead of confirming coverage.",
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

  return {
    ok: true,
    message: `No configured area matches this location. ${config.locationsAndHours.outOfAreaResponse}`,
    data: { inServiceArea: false, configuredAreas: areas, checkedCity: effectiveCity ?? null, checkedZip: effectiveZip ?? null },
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
  const afterHours = input.success ? input.data.afterHours === true : false;
  const urgency = matchedTriggers.length > 0 || vehicleTrapped ? "high" : afterHours ? "medium" : "low";

  const messages = {
    high: "Treat this as urgent. Offer the soonest opening, and if none works, send an owner alert or transfer per the business rules.",
    medium: "Treat this as time-sensitive. Offer the soonest reasonable opening and collect full callback details.",
    low: "This is routine. Continue normal intake and scheduling.",
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

  const { slots, daysChecked } = await generateAvailability(context, options);

  if (slots.length === 0) {
    return {
      ok: true,
      message: `No openings in the next ${daysChecked.length} days. ${context.config.calendarAndDispatch.noAvailabilityBehavior}`,
      data: { slots: [], daysChecked },
    };
  }

  return {
    ok: true,
    message: `Offer these openings one at a time, using the spoken label. ${context.config.calendarAndDispatch.appointmentWindowWording}`,
    data: { slots, timezone: context.config.businessIdentity.timezone },
  };
};

const bookingInput = z.object({
  startsAt: optionalText,
  callerName: optionalText,
  callerPhone: optionalText,
  serviceSummary: optionalText,
  issue: optionalText,
  appointmentType: optionalText,
});

async function createAppointment(context: AgentToolContext, kind: "hold" | "book"): Promise<AgentToolResult> {
  const input = bookingInput.safeParse(context.payload);
  if (!input.success || !input.data.startsAt) {
    return askAgainResult("Pass the chosen slot's startsAt value from the availability check, plus the caller's name and phone number.");
  }

  const { config, client } = context;
  const bookingMode = config.calendarAndDispatch.bookingMode;

  if (kind === "book" && bookingMode === "lead_only") {
    return {
      ok: true,
      message: "This business collects details for the owner instead of booking directly. Save the lead, tell the caller the owner will confirm the time, and do not promise a slot.",
      data: { booked: false, reason: "lead_only" },
    };
  }

  const startsAt = new Date(input.data.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) {
    return askAgainResult("That start time is not valid. Re-check availability and pass an upcoming slot's startsAt value.");
  }

  const durationMinutes = appointmentDurationMinutes(config, input.data.appointmentType);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  const conflicts = await loadConflicts(client.id, startsAt, endsAt);
  if (conflicts.length > 0) {
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
    callerName: input.data.callerName,
    callerPhone: input.data.callerPhone ? normalizePhone(input.data.callerPhone) : null,
    serviceSummary: input.data.serviceSummary ?? input.data.issue,
    startsAt,
    endsAt,
    status,
    metadata: {
      source: "agent_tool",
      kind,
      bookingMode,
      conversationId: context.conversationId,
      configVersionId: context.configVersionId,
      ...(kind === "hold" ? { holdExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString() } : {}),
    },
  }).returning();

  const spoken = spokenSlot(startsAt, config.businessIdentity.timezone);
  const messages: Record<string, string> = {
    booked: `Booked for ${spoken}. Confirm the time with the caller using arrival-window wording, and save the lead with this appointmentId.`,
    needs_approval: `The request for ${spoken} is recorded and waiting on owner approval. Tell the caller the time will be confirmed shortly, and save the lead with this appointmentId.`,
    held: `The ${spoken} slot is held for 30 minutes. Confirm details with the caller, then book it.`,
  };

  return {
    ok: true,
    message: messages[status],
    data: { appointmentId: appointment.id, status, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), spoken },
  };
}

const calendarHold: AgentToolHandler = (context) => createAppointment(context, "hold");
const calendarBook: AgentToolHandler = (context) => createAppointment(context, "book");

const leadInput = z.object({
  phone: optionalText,
  callerPhone: optionalText,
  name: optionalText,
  callerName: optionalText,
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
  const phoneRaw = input.success ? input.data.phone ?? input.data.callerPhone : undefined;
  if (!input.success || !phoneRaw) {
    return askAgainResult("Ask the caller for a callback phone number, then save the lead again.");
  }

  const data = input.data;
  const phone = normalizePhone(phoneRaw);
  const urgency = urgencyLevels.find((level) => level === data.urgency?.toLowerCase());
  const status = leadStatuses.find((candidate) => candidate === data.status?.toLowerCase());
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
      .set({ ...definedFields, updatedAt: new Date() })
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
    metadata: { source: "agent_tool", conversationId: context.conversationId },
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
    channel: data.channel?.toLowerCase() === "email" ? "email" : "sms",
    recipient: config.businessIdentity.ownerPhone,
    status: "queued",
    body,
  }).returning();

  return {
    ok: true,
    message: `Alert for ${config.businessIdentity.ownerName} is queued. Tell the caller their details have been passed along for follow-up.`,
    data: { notificationId: notification.id, channel: notification.channel, status: notification.status },
  };
};

const transferRequest: AgentToolHandler = async ({ config, payload }) => {
  const reason = typeof payload.reason === "string" ? payload.reason : null;
  const ownerPhone = config.businessIdentity.ownerPhone;

  return {
    ok: true,
    message: `Transfer is allowed. Say something natural like "I'm going to forward you to someone who can help better," then transfer to ${config.businessIdentity.ownerName}.`,
    data: {
      transferAllowed: true,
      transferNumber: ownerPhone,
      contactName: config.businessIdentity.ownerName,
      reason,
    },
  };
};

export const agentToolHandlers: Record<string, AgentToolHandler> = {
  "client-context": clientContext,
  "service-area": serviceArea,
  "classify-urgency": classifyUrgency,
  "calendar/availability": calendarAvailability,
  "calendar/hold": calendarHold,
  "calendar/book": calendarBook,
  "leads/upsert": leadsUpsert,
  "owner-alert": ownerAlert,
  "transfer-request": transferRequest,
};
