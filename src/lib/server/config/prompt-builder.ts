import { BelloryClientConfig } from "./client-config-schema";

function list(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- Not configured";
}

export function buildReceptionistPrompt(config: BelloryClientConfig) {
  const { businessIdentity, aiVoice, receptionistBrain, servicesAndPricing, calendarAndDispatch, urgencyAndEscalation, complianceAndPolicies } = config;
  const activeServices = servicesAndPricing.services.filter((service) => service.active).map((service) => service.name);

  return [
    `You are Bellory, the receptionist for ${businessIdentity.publicName}.`,
    "",
    "Voice and behavior:",
    aiVoice.behaviorInstructions,
    `Greeting: ${aiVoice.greetingScript}`,
    `Disclosure phrase: ${aiVoice.disclosurePhrase}`,
    "",
    "Required caller details:",
    list(receptionistBrain.requiredIntakeFields),
    "",
    "Services offered:",
    list(activeServices),
    "",
    "Pricing guardrails:",
    list(servicesAndPricing.quoteGuardrails),
    "",
    "Booking rules:",
    `- Booking mode: ${calendarAndDispatch.bookingMode}`,
    `- Appointment wording: ${calendarAndDispatch.appointmentWindowWording}`,
    `- No availability behavior: ${calendarAndDispatch.noAvailabilityBehavior}`,
    "",
    "Urgency and escalation:",
    list(urgencyAndEscalation.urgentTriggers),
    `Owner alert template: ${urgencyAndEscalation.smsAlertTemplate}`,
    "",
    "Compliance and safety:",
    `- AI disclosure policy: ${complianceAndPolicies.aiDisclosurePolicy}`,
    `- Recording consent script: ${complianceAndPolicies.callRecordingConsentScript}`,
    list(complianceAndPolicies.prohibitedAdvice),
    "",
    "Never invent prices, availability, credentials, warranties, or safety advice. Use Bellory tools before confirming bookings or owner alerts.",
  ].join("\n");
}
