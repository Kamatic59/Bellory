import { BelloryClientConfig } from "./client-config-schema";
import { buildReceptionistPrompt } from "./prompt-builder";
import { getConfigReadiness } from "./readiness-score";

export function buildAgentRuntimeContext(config: BelloryClientConfig) {
  const activeServices = config.servicesAndPricing.services
    .filter((service) => service.active)
    .map((service) => service.name);

  return {
    clientName: config.businessIdentity.publicName,
    industry: config.businessIdentity.industry,
    timezone: config.businessIdentity.timezone,
    ownerName: config.businessIdentity.ownerName,
    ownerPhone: config.businessIdentity.ownerPhone,
    receptionistName: config.aiVoice.receptionistName,
    agentDisplayName: config.aiVoice.agentDisplayName,
    greetingScript: config.aiVoice.greetingScript,
    disclosurePhrase: config.aiVoice.disclosurePhrase,
    systemPrompt: config.aiVoice.systemPrompt,
    bookingMode: config.calendarAndDispatch.bookingMode,
    requiredIntakeFields: config.receptionistBrain.requiredIntakeFields,
    serviceAreas: config.locationsAndHours.serviceAreas,
    activeServices,
    pricingGuardrails: config.servicesAndPricing.quoteGuardrails,
    urgentTriggers: config.urgencyAndEscalation.urgentTriggers,
    noAvailabilityBehavior: config.calendarAndDispatch.noAvailabilityBehavior,
    promptPreview: buildReceptionistPrompt(config),
    readiness: getConfigReadiness(config),
  };
}
