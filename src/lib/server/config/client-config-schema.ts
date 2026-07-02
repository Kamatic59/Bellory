import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const optionalString = z.string().trim().optional();

const timeRangeSchema = z.object({
  open: nonEmptyString,
  close: nonEmptyString,
});

const businessIdentitySchema = z.object({
  legalName: nonEmptyString,
  publicName: nonEmptyString,
  industry: nonEmptyString,
  ownerName: nonEmptyString,
  ownerPhone: nonEmptyString,
  ownerEmail: optionalString,
  timezone: nonEmptyString,
  brandTone: z.array(nonEmptyString).default([]),
  businessSummary: nonEmptyString,
});

const serviceAreaSchema = z.object({
  city: optionalString,
  zip: optionalString,
  radiusMiles: z.number().int().positive().optional(),
});

const locationsAndHoursSchema = z.object({
  primaryAddress: optionalString,
  serviceAreas: z.array(serviceAreaSchema).default([]),
  normalHours: z.record(z.string(), z.array(timeRangeSchema)).default({}),
  emergencyHours: z.record(z.string(), z.unknown()).optional(),
  holidays: z.array(z.object({ date: nonEmptyString, behavior: nonEmptyString })).default([]),
  outOfAreaResponse: nonEmptyString,
});

const phoneRoutingSchema = z.object({
  mode: z.enum(["forward_existing", "new_number", "port_later"]),
  currentNumber: optionalString,
  belloryNumber: optionalString,
  callerIdLabel: optionalString,
  recordingConsentMode: z.enum(["one_party", "two_party", "disabled", "custom"]),
  missedCallFallback: nonEmptyString,
  spamHandling: nonEmptyString,
});

const aiVoiceSchema = z.object({
  provider: z.literal("elevenlabs"),
  providerAccountId: optionalString,
  externalAgentId: optionalString,
  externalVoiceId: optionalString,
  receptionistName: nonEmptyString,
  agentDisplayName: nonEmptyString,
  greetingScript: nonEmptyString,
  speakingPace: nonEmptyString,
  interruptionStyle: nonEmptyString,
  backgroundAmbience: optionalString,
  disclosurePhrase: nonEmptyString,
  behaviorInstructions: nonEmptyString,
  systemPrompt: nonEmptyString,
});

const receptionistBrainSchema = z.object({
  callerIntents: z.array(nonEmptyString).default([]),
  requiredIntakeFields: z.array(nonEmptyString).default([]),
  faqs: z.array(z.object({ question: nonEmptyString, answer: nonEmptyString })).default([]),
  wordsToAvoid: z.array(nonEmptyString).default([]),
  forbiddenClaims: z.array(nonEmptyString).default([]),
  lowConfidencePolicy: nonEmptyString,
});

const serviceSchema = z.object({
  name: nonEmptyString,
  active: z.boolean().default(true),
  description: optionalString,
  requiredQuestions: z.array(nonEmptyString).default([]),
  startingPriceCents: z.number().int().nonnegative().optional(),
  priceRangeCents: z.object({ min: z.number().int().nonnegative(), max: z.number().int().nonnegative() }).optional(),
});

const servicesAndPricingSchema = z.object({
  services: z.array(serviceSchema).default([]),
  diagnosticFees: z.array(z.object({ label: nonEmptyString, amountCents: z.number().int().nonnegative() })).default([]),
  quoteGuardrails: z.array(nonEmptyString).default([]),
  neverQuoteConditions: z.array(nonEmptyString).default([]),
  ownerApprovalThresholdCents: z.number().int().nonnegative().optional(),
});

const qualificationRulesSchema = z.object({
  requiredCallerInfo: z.array(nonEmptyString).default([]),
  requiredIssueDetails: z.array(nonEmptyString).default([]),
  photoRequestRules: z.array(nonEmptyString).default([]),
  propertyTypeQuestions: z.array(nonEmptyString).default([]),
  leadScoreRules: z.array(z.object({ rule: nonEmptyString, points: z.number().int() })).default([]),
  doNotBookConditions: z.array(nonEmptyString).default([]),
});

const calendarAndDispatchSchema = z.object({
  provider: z.enum(["google", "manual", "none"]),
  bookingMode: z.enum(["direct", "owner_approval", "lead_only"]),
  appointmentTypes: z.array(z.object({ name: nonEmptyString, durationMinutes: z.number().int().positive() })).default([]),
  travelBufferMinutes: z.number().int().nonnegative(),
  appointmentWindowWording: nonEmptyString,
  technicianRoutingRules: z.array(nonEmptyString).default([]),
  noAvailabilityBehavior: nonEmptyString,
});

const urgencyAndEscalationSchema = z.object({
  urgentTriggers: z.array(nonEmptyString).default([]),
  primaryFallbackContactId: optionalString,
  secondaryFallbackContactId: optionalString,
  transferHours: z.record(z.string(), z.unknown()).optional(),
  smsAlertTemplate: nonEmptyString,
  operatorReviewThreshold: nonEmptyString,
});

const complianceAndPoliciesSchema = z.object({
  aiDisclosurePolicy: nonEmptyString,
  callRecordingConsentScript: nonEmptyString,
  dataRetentionDays: z.number().int().positive(),
  safetyDisclaimerRules: z.array(nonEmptyString).default([]),
  prohibitedAdvice: z.array(nonEmptyString).default([]),
  complaintHandlingScript: nonEmptyString,
  paymentInfoPolicy: nonEmptyString,
});

const providerConnectionSchema = z.object({
  status: nonEmptyString,
  externalAgentId: optionalString,
  phoneNumberId: optionalString,
  connectionId: optionalString,
  provider: optionalString,
});

const integrationsSchema = z.object({
  elevenLabs: providerConnectionSchema,
  twilio: providerConnectionSchema,
  googleCalendar: providerConnectionSchema,
  crm: providerConnectionSchema.optional(),
});

const launchQaSchema = z.object({
  requiredScenarios: z.array(nonEmptyString).default([]),
  lastRunId: optionalString,
  passed: z.boolean().default(false),
  approvedByUserId: optionalString,
  publishedAt: optionalString,
});

export const belloryClientConfigSchema = z.object({
  businessIdentity: businessIdentitySchema,
  locationsAndHours: locationsAndHoursSchema,
  phoneRouting: phoneRoutingSchema,
  aiVoice: aiVoiceSchema,
  receptionistBrain: receptionistBrainSchema,
  servicesAndPricing: servicesAndPricingSchema,
  qualificationRules: qualificationRulesSchema,
  calendarAndDispatch: calendarAndDispatchSchema,
  urgencyAndEscalation: urgencyAndEscalationSchema,
  complianceAndPolicies: complianceAndPoliciesSchema,
  integrations: integrationsSchema,
  launchQa: launchQaSchema,
});

export const belloryClientConfigDraftSchema = z.object({
  businessIdentity: businessIdentitySchema.partial().optional(),
  locationsAndHours: locationsAndHoursSchema.partial().optional(),
  phoneRouting: phoneRoutingSchema.partial().optional(),
  aiVoice: aiVoiceSchema.partial().optional(),
  receptionistBrain: receptionistBrainSchema.partial().optional(),
  servicesAndPricing: servicesAndPricingSchema.partial().optional(),
  qualificationRules: qualificationRulesSchema.partial().optional(),
  calendarAndDispatch: calendarAndDispatchSchema.partial().optional(),
  urgencyAndEscalation: urgencyAndEscalationSchema.partial().optional(),
  complianceAndPolicies: complianceAndPoliciesSchema.partial().optional(),
  integrations: integrationsSchema.partial().optional(),
  launchQa: launchQaSchema.partial().optional(),
}).passthrough();

export type BelloryClientConfig = z.infer<typeof belloryClientConfigSchema>;
export type BelloryClientConfigDraft = z.infer<typeof belloryClientConfigDraftSchema>;

export const configSections = [
  "businessIdentity",
  "locationsAndHours",
  "phoneRouting",
  "aiVoice",
  "receptionistBrain",
  "servicesAndPricing",
  "qualificationRules",
  "calendarAndDispatch",
  "urgencyAndEscalation",
  "complianceAndPolicies",
  "integrations",
  "launchQa",
] as const;

export type ConfigSection = (typeof configSections)[number];
