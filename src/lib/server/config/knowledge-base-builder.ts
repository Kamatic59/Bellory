import type { BelloryClientConfigDraft } from "./client-config-schema";

type KnowledgeBaseOptions = {
  clientName?: string;
  generatedAt?: Date;
};

function text(value: unknown, fallback = "Not configured.") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function optionalText(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function list(items: unknown[] | undefined, fallback = "- Not configured.") {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  const cleaned = items.map((item) => text(item, "")).filter(Boolean);
  return cleaned.length > 0 ? cleaned.map((item) => `- ${item}`).join("\n") : fallback;
}

function cents(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 100 === 0 ? 0 : 2,
  }).format(value / 100);
}

function compact(items: Array<string | false | null | undefined>) {
  return items.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function formatHours(hours: unknown) {
  if (!hours || typeof hours !== "object" || Array.isArray(hours)) return "- Not configured.";

  const rows = Object.entries(hours as Record<string, unknown>).map(([day, value]) => {
    if (!Array.isArray(value) || value.length === 0) return `- ${day}: Closed or not configured.`;
    const ranges = value.map((range) => {
      if (!range || typeof range !== "object" || Array.isArray(range)) return text(range);
      const open = text((range as Record<string, unknown>).open, "");
      const close = text((range as Record<string, unknown>).close, "");
      return open && close ? `${open}-${close}` : text(range);
    });
    return `- ${day}: ${ranges.join(", ")}`;
  });

  return rows.length > 0 ? rows.join("\n") : "- Not configured.";
}

function formatServiceAreas(serviceAreas: unknown[] | undefined) {
  if (!Array.isArray(serviceAreas) || serviceAreas.length === 0) return "- Not configured.";

  return serviceAreas.map((area) => {
    if (!area || typeof area !== "object" || Array.isArray(area)) return `- ${text(area)}`;
    const record = area as Record<string, unknown>;
    const label = compact([
      optionalText(record.city),
      optionalText(record.zip),
      typeof record.radiusMiles === "number" ? `${record.radiusMiles} mile radius` : "",
    ]).join(" - ");
    return `- ${label || "Configured service area"}`;
  }).join("\n");
}

function formatServices(config: BelloryClientConfigDraft) {
  const services = config.servicesAndPricing?.services;
  if (!Array.isArray(services) || services.length === 0) return "No services are configured yet.";

  return services.map((service, index) => {
    const pricing = compact([
      cents(service.startingPriceCents) ? `Starting at ${cents(service.startingPriceCents)}` : "",
      service.priceRangeCents ? `Typical range ${cents(service.priceRangeCents.min)} to ${cents(service.priceRangeCents.max)}` : "",
    ]).join("; ");

    return compact([
      `### ${index + 1}. ${text(service.name, "Unnamed service")}`,
      `- Active for callers: ${service.active === false ? "No" : "Yes"}`,
      `- Description: ${text(service.description)}`,
      `- Pricing guidance: ${pricing || "Do not quote a price unless a configured rule below applies."}`,
      "- Questions to ask:",
      list(service.requiredQuestions),
    ]).join("\n");
  }).join("\n\n");
}

function formatDiagnosticFees(config: BelloryClientConfigDraft) {
  const fees = config.servicesAndPricing?.diagnosticFees;
  if (!Array.isArray(fees) || fees.length === 0) return "- Not configured.";

  return fees.map((fee) => `- ${text(fee.label, "Fee")}: ${cents(fee.amountCents) || "Amount not configured."}`).join("\n");
}

function formatAppointmentTypes(config: BelloryClientConfigDraft) {
  const appointmentTypes = config.calendarAndDispatch?.appointmentTypes;
  if (!Array.isArray(appointmentTypes) || appointmentTypes.length === 0) return "- Not configured.";

  return appointmentTypes.map((appointment) => {
    const duration = typeof appointment.durationMinutes === "number" ? `${appointment.durationMinutes} minutes` : "Duration not configured";
    return `- ${text(appointment.name, "Appointment")}: ${duration}`;
  }).join("\n");
}

function formatFaqs(config: BelloryClientConfigDraft) {
  const faqs = config.receptionistBrain?.faqs;
  if (!Array.isArray(faqs) || faqs.length === 0) return "No FAQs are configured yet.";

  return faqs.map((faq, index) => [
    `### FAQ ${index + 1}: ${text(faq.question, "Question not configured")}`,
    text(faq.answer, "Answer not configured."),
  ].join("\n")).join("\n\n");
}

function formatJsonBlock(value: unknown, fallback = "Not configured.") {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) return fallback;
  return ["```json", JSON.stringify(value, null, 2), "```"].join("\n");
}

export function buildKnowledgeBaseDocument(config: BelloryClientConfigDraft, options: KnowledgeBaseOptions = {}) {
  const business = config.businessIdentity;
  const locations = config.locationsAndHours;
  const phone = config.phoneRouting;
  const voice = config.aiVoice;
  const brain = config.receptionistBrain;
  const pricing = config.servicesAndPricing;
  const qualification = config.qualificationRules;
  const calendar = config.calendarAndDispatch;
  const urgency = config.urgencyAndEscalation;
  const compliance = config.complianceAndPolicies;
  const integrations = config.integrations;

  const publicName = text(business?.publicName || options.clientName, "Configured business");
  const generatedAt = options.generatedAt ?? new Date();

  return compact([
    `# Bellory Knowledge Base - ${publicName}`,
    `Generated: ${generatedAt.toISOString()}`,
    "Use this document as the attached knowledge base for the ElevenLabs agent assigned to this business. This document gives the receptionist business facts, policies, quoting boundaries, intake requirements, booking rules, urgency triggers, and fallback rules. Live availability, booking, SMS, CRM, and phone actions should still use Bellory tools/webhooks rather than relying only on this document.",

    "## Business Identity",
    compact([
      `- Caller-facing name: ${publicName}`,
      `- Legal name: ${text(business?.legalName)}`,
      `- Industry: ${text(business?.industry)}`,
      `- Timezone: ${text(business?.timezone)}`,
      `- Owner or primary contact: ${text(business?.ownerName)}`,
      `- Owner phone: ${text(business?.ownerPhone)}`,
      `- Owner email: ${text(business?.ownerEmail)}`,
      `- Business summary: ${text(business?.businessSummary)}`,
      "- Brand tone words:",
      list(business?.brandTone),
    ]).join("\n"),

    "## Receptionist Behavior",
    compact([
      `- Greeting script: ${text(voice?.greetingScript)}`,
      `- Speaking pace: ${text(voice?.speakingPace)}`,
      `- Interruption style: ${text(voice?.interruptionStyle)}`,
      `- Background ambience: ${text(voice?.backgroundAmbience)}`,
      `- Behavior instructions: ${text(voice?.behaviorInstructions)}`,
      `- AI disclosure phrase when policy requires or caller asks: ${text(voice?.disclosurePhrase)}`,
      `- AI disclosure policy: ${text(compliance?.aiDisclosurePolicy)}`,
      "- Important: sound like a calm, capable receptionist. Do not over-explain internal tools. If a caller needs a human, say you are forwarding them to someone who can help better.",
    ]).join("\n"),

    "## Service Area and Hours",
    compact([
      `- Primary address: ${text(locations?.primaryAddress)}`,
      "- Service areas:",
      formatServiceAreas(locations?.serviceAreas),
      "- Normal hours:",
      formatHours(locations?.normalHours),
      "- Emergency hours:",
      formatJsonBlock(locations?.emergencyHours),
      "- Holidays:",
      Array.isArray(locations?.holidays) && locations.holidays.length > 0
        ? locations.holidays.map((holiday) => `- ${holiday.date}: ${holiday.behavior}`).join("\n")
        : "- Not configured.",
      `- Out-of-area response: ${text(locations?.outOfAreaResponse)}`,
    ]).join("\n"),

    "## Phone Routing and Fallback",
    compact([
      `- Phone mode: ${text(phone?.mode)}`,
      `- Current business number: ${text(phone?.currentNumber)}`,
      `- Bellory number: ${text(phone?.belloryNumber)}`,
      `- Caller ID label: ${text(phone?.callerIdLabel)}`,
      `- Recording consent mode: ${text(phone?.recordingConsentMode)}`,
      `- Missed-call or human fallback language: ${text(phone?.missedCallFallback, "I am going to forward you to someone who can help better.")}`,
      `- Spam handling: ${text(phone?.spamHandling)}`,
    ]).join("\n"),

    "## Caller Intents and Required Intake",
    compact([
      "- Caller intents Bellory should recognize:",
      list(brain?.callerIntents),
      "- Required intake fields:",
      list(brain?.requiredIntakeFields),
      "- Required caller information:",
      list(qualification?.requiredCallerInfo),
      "- Required issue details:",
      list(qualification?.requiredIssueDetails),
      "- Property type questions:",
      list(qualification?.propertyTypeQuestions),
      "- Photo request rules:",
      list(qualification?.photoRequestRules),
    ]).join("\n"),

    "## Services and Pricing",
    formatServices(config),

    "## Quote Guardrails",
    compact([
      "- Diagnostic fees:",
      formatDiagnosticFees(config),
      "- Quote guardrails:",
      list(pricing?.quoteGuardrails),
      "- Never quote conditions:",
      list(pricing?.neverQuoteConditions),
      `- Owner approval threshold: ${cents(pricing?.ownerApprovalThresholdCents) || "Not configured."}`,
      "- If pricing is uncertain, collect the issue details and explain that the team will confirm the exact price before work begins.",
    ]).join("\n"),

    "## Booking and Dispatch Rules",
    compact([
      `- Calendar provider: ${text(calendar?.provider)}`,
      `- Booking mode: ${text(calendar?.bookingMode)}`,
      "- Appointment types:",
      formatAppointmentTypes(config),
      `- Travel buffer: ${typeof calendar?.travelBufferMinutes === "number" ? `${calendar.travelBufferMinutes} minutes` : "Not configured."}`,
      `- Appointment window wording: ${text(calendar?.appointmentWindowWording)}`,
      "- Technician routing rules:",
      list(calendar?.technicianRoutingRules),
      `- No availability behavior: ${text(calendar?.noAvailabilityBehavior)}`,
      "- Never promise an appointment until the live calendar or booking tool confirms the slot.",
    ]).join("\n"),

    "## Urgency and Escalation",
    compact([
      "- Urgent triggers:",
      list(urgency?.urgentTriggers),
      `- Primary fallback contact ID: ${text(urgency?.primaryFallbackContactId)}`,
      `- Secondary fallback contact ID: ${text(urgency?.secondaryFallbackContactId)}`,
      "- Transfer hours:",
      formatJsonBlock(urgency?.transferHours),
      `- SMS alert template: ${text(urgency?.smsAlertTemplate)}`,
      `- Operator review threshold: ${text(urgency?.operatorReviewThreshold)}`,
      "- If the caller describes immediate danger, active damage, safety risk, or something outside Bellory authority, do not improvise. Escalate using the configured fallback path.",
    ]).join("\n"),

    "## FAQs",
    formatFaqs(config),

    "## Words and Claims to Avoid",
    compact([
      "- Words or phrases to avoid:",
      list(brain?.wordsToAvoid),
      "- Forbidden claims:",
      list(brain?.forbiddenClaims),
      `- Low-confidence policy: ${text(brain?.lowConfidencePolicy)}`,
    ]).join("\n"),

    "## Compliance and Safety Policies",
    compact([
      `- Call recording consent script: ${text(compliance?.callRecordingConsentScript)}`,
      `- Data retention days: ${text(compliance?.dataRetentionDays)}`,
      "- Safety disclaimer rules:",
      list(compliance?.safetyDisclaimerRules),
      "- Prohibited advice:",
      list(compliance?.prohibitedAdvice),
      `- Complaint handling script: ${text(compliance?.complaintHandlingScript)}`,
      `- Payment information policy: ${text(compliance?.paymentInfoPolicy)}`,
    ]).join("\n"),

    "## Integrations the Agent Should Expect",
    compact([
      `- ElevenLabs status: ${text(integrations?.elevenLabs?.status)}`,
      `- ElevenLabs agent ID: ${text(integrations?.elevenLabs?.externalAgentId)}`,
      `- Twilio status: ${text(integrations?.twilio?.status)}`,
      `- Twilio phone number ID: ${text(integrations?.twilio?.phoneNumberId)}`,
      `- Google Calendar status: ${text(integrations?.googleCalendar?.status)}`,
      `- Google Calendar connection ID: ${text(integrations?.googleCalendar?.connectionId)}`,
      `- CRM status: ${text(integrations?.crm?.status)}`,
      "- Use live tools for booking, owner alerts, CRM/job creation, and call transfer whenever those tools are available.",
    ]).join("\n"),

    "## What To Do When Unsure",
    compact([
      "- Ask one short clarifying question at a time.",
      "- Do not make up prices, credentials, service availability, warranty terms, or exact arrival times.",
      "- If the caller asks whether they are speaking with AI, answer honestly using the configured disclosure phrase.",
      "- If the caller asks for a person, if the situation is urgent, or if the issue is outside the configured rules, forward them to someone who can help better.",
      "- End with a clear next step: appointment held, owner notified, callback requested, or transfer started.",
    ]).join("\n"),
  ]).join("\n\n").concat("\n");
}
