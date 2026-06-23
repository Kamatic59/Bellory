import { BelloryClientConfigDraft, ConfigSection, configSections } from "./client-config-schema";

type Requirement = {
  section: ConfigSection;
  path: string;
  label: string;
};

const requirements: Requirement[] = [
  { section: "businessIdentity", path: "businessIdentity.publicName", label: "Caller-facing business name" },
  { section: "businessIdentity", path: "businessIdentity.industry", label: "Industry" },
  { section: "businessIdentity", path: "businessIdentity.ownerName", label: "Owner name" },
  { section: "businessIdentity", path: "businessIdentity.ownerPhone", label: "Owner phone" },
  { section: "locationsAndHours", path: "locationsAndHours.serviceAreas", label: "Service area" },
  { section: "locationsAndHours", path: "locationsAndHours.normalHours", label: "Normal hours" },
  { section: "phoneRouting", path: "phoneRouting.mode", label: "Phone routing mode" },
  { section: "phoneRouting", path: "phoneRouting.recordingConsentMode", label: "Recording consent mode" },
  { section: "aiVoice", path: "aiVoice.greetingScript", label: "Greeting script" },
  { section: "aiVoice", path: "aiVoice.disclosurePhrase", label: "Disclosure phrase" },
  { section: "receptionistBrain", path: "receptionistBrain.requiredIntakeFields", label: "Required intake fields" },
  { section: "servicesAndPricing", path: "servicesAndPricing.services", label: "Service catalog" },
  { section: "servicesAndPricing", path: "servicesAndPricing.quoteGuardrails", label: "Pricing guardrails" },
  { section: "qualificationRules", path: "qualificationRules.requiredCallerInfo", label: "Caller qualification fields" },
  { section: "calendarAndDispatch", path: "calendarAndDispatch.bookingMode", label: "Booking mode" },
  { section: "calendarAndDispatch", path: "calendarAndDispatch.appointmentTypes", label: "Appointment types" },
  { section: "urgencyAndEscalation", path: "urgencyAndEscalation.urgentTriggers", label: "Urgent triggers" },
  { section: "urgencyAndEscalation", path: "urgencyAndEscalation.smsAlertTemplate", label: "Owner alert template" },
  { section: "complianceAndPolicies", path: "complianceAndPolicies.aiDisclosurePolicy", label: "AI disclosure policy" },
  { section: "complianceAndPolicies", path: "complianceAndPolicies.callRecordingConsentScript", label: "Recording consent script" },
  { section: "integrations", path: "integrations.elevenLabs.status", label: "ElevenLabs status" },
  { section: "integrations", path: "integrations.twilio.status", label: "Twilio status" },
  { section: "integrations", path: "integrations.googleCalendar.status", label: "Calendar status" },
  { section: "launchQa", path: "launchQa.requiredScenarios", label: "Launch QA scenarios" },
];

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function hasValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return false;
}

export function getConfigReadiness(config: BelloryClientConfigDraft) {
  const missing = requirements.filter((requirement) => !hasValue(readPath(config, requirement.path)));
  const complete = requirements.length - missing.length;
  const percentage = Math.round((complete / requirements.length) * 100);
  const sectionStatus = Object.fromEntries(configSections.map((section) => {
    const sectionRequirements = requirements.filter((requirement) => requirement.section === section);
    const sectionMissing = sectionRequirements.filter((requirement) => !hasValue(readPath(config, requirement.path)));
    return [section, {
      complete: sectionMissing.length === 0,
      missing: sectionMissing.map((requirement) => requirement.label),
    }];
  }));

  return {
    complete,
    missing: missing.map((requirement) => requirement.label),
    percentage,
    required: requirements.length,
    sectionStatus,
  };
}
