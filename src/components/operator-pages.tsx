"use client";

import clsx from "clsx";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Brain,
  Building2,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Clock3,
  Database,
  FileText,
  FileChartColumn,
  Gauge,
  Headphones,
  KeyRound,
  ListChecks,
  MapPinned,
  MessageSquareText,
  PhoneForwarded,
  PhoneIncoming,
  Route,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { BelloryClientConfigDraft } from "@/lib/server/config/client-config-schema";
import {
  getCalendarStatus,
  getClientActivity,
  getClientConfig,
  publishClientConfig,
  saveClientConfigDraft,
  syncElevenLabsAgent,
  validateClientConfig,
  type AppClient,
  type CalendarStatus,
  type ClientActivity,
  type ClientIssue,
  type ClientMetrics,
  type ClientConfigPayload,
  type CreateClientPayload,
  type Readiness,
  type ValidationResult,
} from "@/lib/client-api";
import { buildDefaultAgentSystemPrompt } from "@/lib/config/agent-system-prompt";
import { PageId } from "./app-shell";
import { Badge, Button, Card, DemoState, EmptyCheck, IconBox, Input, Progress, SectionTitle, Select, Toggle } from "./ui";

type Tone = "mint" | "honey" | "coral" | "blue" | "violet";
type StatusTone = "mint" | "honey" | "coral" | "blue" | "muted";

const setupSteps = [
  "Business identity",
  "Locations & hours",
  "Phone routing",
  "Agent identity & prompt",
  "Receptionist brain",
  "Services & pricing",
  "Qualification rules",
  "Calendar & dispatch",
  "Urgency & escalation",
  "Compliance & policies",
  "Integrations",
  "Launch QA",
] as const;

const accountTabs = [
  "Overview",
  "Business Brain",
  "Agent & Prompt",
  "Call Flow",
  "Services & Pricing",
  "Calendar & Dispatch",
  "Urgency & Fallbacks",
  "Knowledge Base",
  "Compliance",
  "Integrations",
  "Testing",
  "Calls & Jobs",
  "Stats",
] as const;

type SetupStep = (typeof setupSteps)[number];
type AccountTab = (typeof accountTabs)[number];

type StepDetail = {
  title: string;
  description: string;
  fields: string[];
  checklist: string[];
  backend: string;
};

const onboardingDetails: Record<SetupStep, StepDetail> = {
  "Business identity": {
    title: "Define the business Bellory represents.",
    description: "The AI needs the same facts a trained receptionist would use before answering the first call.",
    fields: ["Legal business name", "Caller-facing name", "Owner / primary contact", "Business category", "Short company description", "Brand words"],
    checklist: ["Primary contact saved", "Industry selected", "Caller-facing name approved", "Business timezone set"],
    backend: "clients, client_config_versions.businessIdentity",
  },
  "Locations & hours": {
    title: "Set where and when the business operates.",
    description: "Service area, working hours, holidays, and after-hours behavior determine what the AI can promise.",
    fields: ["Primary address", "Service cities / ZIP codes", "Normal hours", "Emergency hours", "Holiday schedule", "Out-of-area response"],
    checklist: ["Timezone mapped to calendar", "After-hours script selected", "Service area saved", "Holiday overrides ready"],
    backend: "client_config_versions.locationsAndHours",
  },
  "Phone routing": {
    title: "Decide how callers reach the receptionist.",
    description: "Choose forwarding, a new Bellory number, or porting later, then define recording and failover behavior.",
    fields: ["Current phone number", "Caller ID label", "Forward-to number", "Recording consent mode", "Missed-call fallback", "Spam handling"],
    checklist: ["Twilio number or forward target selected", "Recording rule approved", "Caller ID planned", "Route failover configured"],
    backend: "phone_numbers, client_config_versions.phoneRouting",
  },
  "Agent identity & prompt": {
    title: "Name the receptionist and build the agent prompt.",
    description: "Each customer gets their own ElevenLabs agent with a receptionist name, greeting, voice behavior, disclosure line, and editable system prompt.",
    fields: ["Receptionist name", "ElevenLabs agent display name", "Voice / agent ID", "Greeting script", "System prompt", "Disclosure phrase"],
    checklist: ["Receptionist name approved", "System prompt generated", "Greeting matches the business", "Disclosure language approved"],
    backend: "voice_agents, client_config_versions.aiVoice",
  },
  "Receptionist brain": {
    title: "Teach Bellory how this business thinks.",
    description: "This is the source of truth for what the AI can answer, ask, avoid, and escalate.",
    fields: ["Business summary", "Caller intents", "Required intake questions", "FAQ answers", "Words to avoid", "Forbidden claims"],
    checklist: ["Prompt instructions drafted", "FAQ knowledge loaded", "Forbidden claims saved", "Low-confidence policy selected"],
    backend: "client_config_versions.receptionistBrain",
  },
  "Services & pricing": {
    title: "Configure services, quote ranges, and limits.",
    description: "Pricing must be structured so the AI knows when to give a range, ask more questions, or refuse exact pricing.",
    fields: ["Service catalog", "Diagnostic fees", "Starting prices", "Quote ranges", "Upsell rules", "Never-quote conditions"],
    checklist: ["At least one service active", "Quote ranges approved", "Exact-price restrictions saved", "Owner approval threshold set"],
    backend: "client_config_versions.servicesAndPricing",
  },
  "Qualification rules": {
    title: "Tell the AI what to ask before booking.",
    description: "Qualification fields make every call useful: issue, urgency, location, photos, property type, and decision maker.",
    fields: ["Caller info", "Issue details", "Photo/SMS request rules", "Property type questions", "Lead score rules", "Do-not-book conditions"],
    checklist: ["Required fields selected", "Lead scoring rules saved", "Photo request policy approved", "Spam handling configured"],
    backend: "client_config_versions.qualificationRules",
  },
  "Calendar & dispatch": {
    title: "Connect appointments to real availability.",
    description: "Booking rules decide direct booking, owner approval, travel buffers, tech assignment, and reschedules.",
    fields: ["Calendar provider", "Booking mode", "Appointment types", "Slot length", "Travel buffer", "Technician routing rules"],
    checklist: ["Calendar provider selected", "Booking mode selected", "Slot templates configured", "No-availability fallback set"],
    backend: "calendar_connections, client_config_versions.calendarAndDispatch",
  },
  "Urgency & escalation": {
    title: "Define when Bellory gets a human involved.",
    description: "The AI needs explicit urgent triggers, transfer order, low-confidence paths, and after-hours escalation rules.",
    fields: ["Urgent trigger phrases", "Primary fallback", "Secondary fallback", "Transfer hours", "SMS alert template", "Operator review threshold"],
    checklist: ["Urgent intents mapped", "Transfer numbers planned", "SMS templates approved", "Low-confidence handoff enabled"],
    backend: "owner_notifications, client_config_versions.urgencyAndEscalation",
  },
  "Compliance & policies": {
    title: "Set the rules the AI must never break.",
    description: "Recording consent, AI disclosure, retention, privacy, safety, and forbidden advice belong here.",
    fields: ["AI disclosure policy", "Call recording consent", "Data retention", "Safety disclaimer rules", "Prohibited advice", "Complaint script"],
    checklist: ["Consent language approved", "Retention policy set", "Never-say list saved", "Complaint path configured"],
    backend: "audit_logs, client_config_versions.complianceAndPolicies",
  },
  Integrations: {
    title: "Connect the tools the AI will use.",
    description: "Provider credentials and tool permissions need to be explicit before backend wiring starts.",
    fields: ["ElevenLabs agent", "Twilio account", "Google Calendar account", "CRM / job system", "SMS provider", "Billing system"],
    checklist: ["Tool permissions scoped", "Webhook endpoints planned", "Provider status visible", "Secrets ready for environment vars"],
    backend: "voice_agents, phone_numbers, calendar_connections",
  },
  "Launch QA": {
    title: "Prove the receptionist is safe to launch.",
    description: "Run the same test scenarios every account needs before traffic goes live.",
    fields: ["Normal booking test", "Urgent call test", "Quote shopper test", "After-hours test", "No availability test", "Angry caller test"],
    checklist: ["All required scenarios pass", "Owner approves summaries", "Phone route live", "Rollback plan ready"],
    backend: "eval_scenarios, eval_runs, client_config_versions.launchQa",
  },
};

const sectionLabels: Record<string, string> = {
  businessIdentity: "Business identity",
  locationsAndHours: "Locations & hours",
  phoneRouting: "Phone routing",
  aiVoice: "Agent & prompt",
  receptionistBrain: "Receptionist brain",
  servicesAndPricing: "Services & pricing",
  qualificationRules: "Qualification rules",
  calendarAndDispatch: "Calendar & dispatch",
  urgencyAndEscalation: "Urgency & escalation",
  complianceAndPolicies: "Compliance & policies",
  integrations: "Integrations",
  launchQa: "Launch QA",
};

const emptyMetrics: ClientMetrics = {
  callsAnswered: 0,
  appointmentsBooked: 0,
  jobsSaved: 0,
  estimatedRevenueCents: 0,
  hoursSavedMinutes: 0,
  urgentHandoffs: 0,
  toolFailures: 0,
};

function displayStatus(status: string) {
  return status.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function displayPlan(plan: string) {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function statusTone(value: string): StatusTone {
  return value === "Live" || value === "Connected" || value === "Published" || value === "Complete" || value === "low"
    ? "mint"
    : value === "Needs Attention" || value === "Issue" || value === "High" || value === "critical" || value === "high"
      ? "coral"
      : value === "Setup" || value === "Pilot" || value === "Draft" || value === "medium" || value === "Preview"
        ? "honey"
        : "muted";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B";
}

function formatCurrency(cents = 0) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatHours(minutes = 0) {
  return `${Math.round(minutes / 60)}`;
}

function ageFrom(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 48) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
}

function getMetrics(client: AppClient) {
  const metrics = client.metrics ?? emptyMetrics;
  return {
    setupProgress: client.readiness?.percentage ?? 0,
    jobsSaved: metrics.jobsSaved,
    hoursSaved: formatHours(metrics.hoursSavedMinutes),
    revenueSaved: formatCurrency(metrics.estimatedRevenueCents),
    callsAnswered: metrics.callsAnswered,
    appointmentsBooked: metrics.appointmentsBooked,
    errors: client.openIssues + metrics.toolFailures,
    owner: client.primaryContactName || "Business owner",
    lastIssue: client.openIssues > 0 ? `${client.openIssues} open issue${client.openIssues === 1 ? "" : "s"}` : "None",
  };
}

function getPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function getString(config: BelloryClientConfigDraft | null, path: string, fallback = "") {
  const value = getPath(config, path);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return typeof value === "string" ? value : fallback;
}

function getNumber(config: BelloryClientConfigDraft | null, path: string, fallback = 0) {
  const value = getPath(config, path);
  return typeof value === "number" ? value : fallback;
}

function getStringArray(config: BelloryClientConfigDraft | null, path: string) {
  const value = getPath(config, path);
  return Array.isArray(value) ? value.map(String) : [];
}

function getJsonValue(config: BelloryClientConfigDraft | null, path: string, fallback: unknown[] | Record<string, unknown> = []) {
  return getPath(config, path) ?? fallback;
}

function setConfigPath(config: BelloryClientConfigDraft, path: string, value: unknown): BelloryClientConfigDraft {
  const parts = path.split(".");
  const root: Record<string, unknown> = { ...config };
  let cursor = root;

  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }

    const current = cursor[part];
    const next = current && typeof current === "object" && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {};
    cursor[part] = next;
    cursor = next;
  });

  return root as BelloryClientConfigDraft;
}

function splitLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function setupPatch(form: SetupForm): BelloryClientConfigDraft {
  const publicName = form.publicName || form.name;
  const ownerName = form.primaryContactName || "Business owner";
  const ownerPhone = form.primaryContactPhone || "+18015550100";
  const receptionistName = form.receptionistName.trim() || "Sam";
  const agentDisplayName = form.agentDisplayName.trim() || `${receptionistName} - ${publicName}`;
  const systemPrompt = form.systemPrompt.trim() || buildDefaultAgentSystemPrompt({ receptionistName, businessName: publicName });

  return {
    businessIdentity: {
      legalName: form.name,
      publicName,
      industry: form.industry,
      ownerName,
      ownerPhone,
      ownerEmail: form.primaryContactEmail,
      timezone: form.timezone,
      brandTone: form.brandTone.split(",").map((item) => item.trim()).filter(Boolean),
      businessSummary: form.businessSummary || `${publicName} is a local service business. Bellory should qualify callers, understand urgency, and book or escalate based on the configured rules.`,
    },
    locationsAndHours: {
      primaryAddress: form.primaryAddress,
      serviceAreas: [{ city: form.serviceArea, radiusMiles: Number(form.radiusMiles) || 25 }],
      outOfAreaResponse: form.outOfAreaResponse,
    },
    phoneRouting: {
      mode: form.phoneChoice === "new" ? "new_number" : form.phoneChoice === "port" ? "port_later" : "forward_existing",
      currentNumber: form.primaryContactPhone,
      callerIdLabel: publicName,
      missedCallFallback: form.missedCallFallback,
      spamHandling: form.spamHandling,
    },
    aiVoice: {
      provider: "elevenlabs",
      receptionistName,
      agentDisplayName,
      greetingScript: form.greetingScript || `Thanks for calling ${publicName}. This is ${receptionistName} at the front desk. How can I help today?`,
      speakingPace: form.speakingPace,
      interruptionStyle: form.interruptionStyle,
      backgroundAmbience: form.backgroundAmbience,
      disclosurePhrase: form.disclosurePhrase || `Yes, I'm ${receptionistName}, the AI receptionist for ${publicName}. I can help get your information over, check scheduling, or forward you to someone if needed.`,
      behaviorInstructions: form.behaviorInstructions,
      systemPrompt,
    },
    calendarAndDispatch: {
      bookingMode: form.bookingChoice === "approval" ? "owner_approval" : form.bookingChoice === "lead" ? "lead_only" : "direct",
      noAvailabilityBehavior: form.noAvailabilityBehavior,
    },
    urgencyAndEscalation: {
      urgentTriggers: splitLines(form.urgentTriggers),
      smsAlertTemplate: form.smsAlertTemplate,
      operatorReviewThreshold: form.operatorReviewThreshold,
    },
    complianceAndPolicies: {
      aiDisclosurePolicy: form.aiDisclosurePolicy,
      callRecordingConsentScript: form.callRecordingConsentScript,
    },
    integrations: {
      elevenLabs: { status: "not_connected" },
      twilio: { status: "not_connected" },
      googleCalendar: { status: "not_connected" },
      crm: { status: "planned" },
    },
    launchQa: {
      requiredScenarios: splitLines(form.launchScenarios),
      passed: false,
    },
  };
}

function MetricCard({ label, value, helper, icon, tone = "mint" }: { label: string; value: string; helper: string; icon: LucideIcon; tone?: Tone }) {
  return (
    <Card hover className="p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="font-mono-ui pt-1 text-[10px] font-semibold uppercase tracking-[.16em] text-[#94836A]">{label}</p>
        <IconBox icon={icon} tone={tone} />
      </div>
      <p className="font-mono-ui text-[30px] font-semibold leading-none tracking-[-.03em] text-white">{value}</p>
      <p className="mt-2.5 text-[11px] leading-5 text-[#94836A]">{helper}</p>
    </Card>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "font-mono-ui rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-[.1em] transition-colors",
        active
          ? "bg-[#C7F76F] text-[#14110B] shadow-[0_4px_14px_rgba(199,247,111,.18)]"
          : "border border-white/[.08] bg-white/[.02] text-[#94836A] hover:border-white/[.16] hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

function ConfigPanel({ title, eyebrow, icon, tone = "mint", children, action }: { title: string; eyebrow?: string; icon?: LucideIcon; tone?: Tone; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-5">
      <SectionTitle title={title} eyebrow={eyebrow} action={action ?? (icon ? <IconBox icon={icon} tone={tone} /> : undefined)} />
      {children}
    </Card>
  );
}

function LoadingState({ title = "Loading live data..." }: { title?: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="typing-dot size-1.5 rounded-full bg-[#C7F76F]" />
          <span className="typing-dot size-1.5 rounded-full bg-[#C7F76F]" />
          <span className="typing-dot size-1.5 rounded-full bg-[#C7F76F]" />
        </span>
        <p className="text-[13px] font-semibold text-[#C6B9A6]">{title}</p>
      </div>
      <div className="mt-5 space-y-3">
        {[82, 64, 71].map((width, index) => (
          <div key={index} className="h-9 animate-pulse rounded-xl bg-white/[.03]" style={{ width: `${width}%` }} />
        ))}
      </div>
    </Card>
  );
}

function ErrorState({ title, error, onRetry }: { title: string; error: string; onRetry?: () => void }) {
  return (
    <Card className="p-6">
      <DemoState title={title} description={error} tone="coral" />
      {onRetry && <Button className="mt-4" kind="secondary" onClick={onRetry}>Retry</Button>}
    </Card>
  );
}

function ChecklistGrid({ items }: { items: string[] }) {
  return <div className="grid gap-2 md:grid-cols-2">{items.map((item) => <EmptyCheck key={item} text={item} />)}</div>;
}

function ChoiceGrid({ selected, onSelect, options }: { selected: string; onSelect: (id: string) => void; options: Array<{ id: string; title: string; description: string }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {options.map((option) => (
        <button key={option.id} onClick={() => onSelect(option.id)} className={clsx("relative rounded-xl border p-4 text-left transition", selected === option.id ? "border-[#C7F76F]/[.35] bg-[#C7F76F]/[.05] shadow-[0_0_0_1px_rgba(199,247,111,.14),0_8px_24px_rgba(0,0,0,.2)]" : "border-white/[.07] bg-white/[.02] hover:border-white/[.14] hover:bg-white/[.04]")}>
          {selected === option.id && (
            <span className="absolute right-3 top-3 grid size-4 place-items-center rounded-full bg-[#C7F76F] text-[#14110B]"><Check size={10} strokeWidth={3.5} /></span>
          )}
          <p className="pr-6 text-[13px] font-bold tracking-[-.01em] text-white">{option.title}</p>
          <p className="mt-2 text-[11px] leading-5 text-[#94836A]">{option.description}</p>
        </button>
      ))}
    </div>
  );
}

function BackendMapping({ label, checks }: { label: string; checks: string[] }) {
  return (
    <div className="mt-6 grid gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-4 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#C7F76F]">Backend mapping</p>
        <p className="mt-2 text-[12px] leading-5 text-[#B7AB98]">Saved into <span className="font-bold text-white">{label}</span>. This setup creates a real Supabase client record and draft config.</p>
      </div>
      <div className="space-y-2">{checks.map((check) => <EmptyCheck key={check} text={check} />)}</div>
    </div>
  );
}

function AccountRow({ client, onOpen }: { client: AppClient; onOpen: () => void }) {
  const metrics = getMetrics(client);
  const status = displayStatus(client.status);

  return (
    <button onClick={onOpen} className="group grid w-full gap-3 border-t border-white/[.05] px-5 py-4 text-left transition hover:bg-[#C7F76F]/[.02] lg:grid-cols-[1.35fr_.65fr_.75fr_.7fr_.65fr_90px] lg:items-center">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#C7F76F]/[.08] text-[11px] font-black text-[#C7F76F] shadow-[inset_0_0_0_1px_rgba(199,247,111,.1)]">{initials(client.name)}</span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold tracking-[-.01em] text-white">{client.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#94836A]">{client.industry} · {metrics.owner}</p>
        </div>
      </div>
      <span><Badge tone={statusTone(status)}>{status}</Badge></span>
      <div>
        <p className="font-mono-ui mb-1.5 text-[11px] font-semibold text-white">{metrics.setupProgress}%</p>
        <Progress value={metrics.setupProgress} tone={metrics.setupProgress > 90 ? "mint" : metrics.setupProgress > 70 ? "honey" : "coral"} />
      </div>
      <p className="font-mono-ui text-[12px] text-[#C6B9A6]">{metrics.jobsSaved}</p>
      <p className={clsx("font-mono-ui text-[12px] font-bold", metrics.errors > 0 ? "text-[#F08B72]" : "text-[#94C759]")}>{metrics.errors}</p>
      <span className="justify-self-start text-[11px] font-bold text-[#C7F76F] transition group-hover:translate-x-0.5 lg:justify-self-end">Open →</span>
    </button>
  );
}

export function AccountsPage({
  clients,
  loading,
  error,
  navigate,
  onOpenAccount,
  onRefresh,
}: {
  clients: AppClient[];
  loading: boolean;
  error: string | null;
  navigate: (id: PageId) => void;
  onOpenAccount: (id: string) => void;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const shown = useMemo(() => clients.filter((client) => {
    const status = displayStatus(client.status);
    const matchesFilter = filter === "All" || status === filter;
    const target = `${client.name} ${client.industry} ${status}`.toLowerCase();
    return matchesFilter && target.includes(query.toLowerCase());
  }), [clients, filter, query]);

  const totals = clients.reduce((acc, client) => {
    const metrics = getMetrics(client);
    acc.calls += metrics.callsAnswered;
    acc.jobs += metrics.jobsSaved;
    acc.hours += Number(metrics.hoursSaved);
    acc.issues += metrics.errors;
    return acc;
  }, { calls: 0, jobs: 0, hours: 0, issues: 0 });

  if (loading) return <LoadingState title="Loading businesses..." />;
  if (error) return <ErrorState title="Could not load accounts" error={error} onRetry={onRefresh} />;

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(199,247,111,.08),transparent_34%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge><span className="size-1.5 rounded-full bg-[#C7F76F]" /> Live accounts</Badge>
            <h1 className="font-display mt-4 max-w-3xl text-3xl font-medium tracking-[-.02em] text-white sm:text-[2.6rem] sm:leading-[1.05]">Every receptionist, at a glance.</h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#94836A]">Find a business, launch a receptionist, or fix what is stuck — readiness, issues, and metrics update live from the backend.</p>
          </div>
          <Button onClick={() => navigate("setup")} className="w-fit"><ClipboardCheck size={14} /> Set up new business</Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={PhoneIncoming} label="Calls answered" value={`${totals.calls}`} helper="From client_daily_metrics" />
        <MetricCard icon={CalendarCheck} label="Jobs saved" value={`${totals.jobs}`} helper="Booked or escalated instead of missed" tone="blue" />
        <MetricCard icon={Clock3} label="Hours saved" value={`${totals.hours}`} helper="Estimated receptionist time saved" tone="honey" />
        <MetricCard icon={TriangleAlert} label="Open issues" value={`${totals.issues}`} helper="Config or runtime problems" tone={totals.issues > 0 ? "coral" : "mint"} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", "Live", "Setup", "Pilot", "Needs Attention", "Paused", "Draft"].map((item) => (
              <FilterPill key={item} label={item} active={filter === item} onClick={() => setFilter(item)} />
            ))}
          </div>
          <div className="relative w-full lg:w-[330px]">
            <Search size={14} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#94836A]" />
            <Input value={query} onChange={setQuery} placeholder="Search businesses..." className="pl-9" />
          </div>
        </div>
        <div>
          <div className="font-mono-ui hidden gap-3 border-t border-white/[.05] bg-white/[.015] px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[.18em] text-[#6E5F49] lg:grid lg:grid-cols-[1.35fr_.65fr_.75fr_.7fr_.65fr_90px]">
            <span>Business</span><span>Status</span><span>Readiness</span><span>Jobs saved</span><span>Issues</span><span />
          </div>
          {shown.map((client) => <AccountRow key={client.id} client={client} onOpen={() => onOpenAccount(client.id)} />)}
          {shown.length === 0 && <div className="p-5"><DemoState tone="honey" title="No businesses match" description="Create a real business record from New Business Setup, or clear the filter." /></div>}
        </div>
      </Card>
    </div>
  );
}

function AccountDirectoryCard({ client, onOpen }: { client: AppClient; onOpen: () => void }) {
  const metrics = getMetrics(client);
  const status = displayStatus(client.status);

  return (
    <button onClick={onOpen} className="glass group flex h-full flex-col rounded-[20px] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#C7F76F]/[.22] hover:shadow-[0_22px_54px_rgba(0,0,0,.28)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#C7F76F]/[.08] text-[12px] font-black text-[#C7F76F] shadow-[inset_0_0_0_1px_rgba(199,247,111,.1)]">{initials(client.name)}</span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold tracking-[-.015em] text-white">{client.name}</p>
            <p className="mt-0.5 text-[11px] text-[#94836A]">{client.industry}</p>
          </div>
        </div>
        <Badge tone={statusTone(status)}>{status}</Badge>
      </div>
      <div className="grid gap-0 text-[11px] text-[#94836A]">
        {([
          ["Owner", metrics.owner],
          ["Plan", displayPlan(client.plan)],
          ["Config", client.configStatus || "draft"],
          ["Version", String(client.configVersion ?? "new")],
        ] as const).map(([label, value], index) => (
          <div key={label} className={clsx("flex items-baseline justify-between gap-3 py-1.5", index > 0 && "border-t border-white/[.04]")}>
            <span className="font-mono-ui text-[9px] font-semibold uppercase tracking-[.16em]">{label}</span>
            <span className="truncate font-semibold text-[#EFE1C8]">{value}</span>
          </div>
        ))}
      </div>
      <div className="my-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono-ui text-[9px] font-semibold uppercase tracking-[.16em] text-[#94836A]">Readiness</span>
          <span className="font-mono-ui text-[11px] font-bold text-[#C7F76F]">{metrics.setupProgress}%</span>
        </div>
        <Progress value={metrics.setupProgress} tone={metrics.setupProgress > 90 ? "mint" : metrics.setupProgress > 70 ? "honey" : "coral"} />
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/[.06] pt-4">
        <div><p className="font-mono-ui text-[16px] font-semibold tracking-tight text-white">{metrics.jobsSaved}</p><p className="font-mono-ui mt-0.5 text-[8px] uppercase tracking-[.16em] text-[#6E5F49]">Jobs</p></div>
        <div><p className="font-mono-ui text-[16px] font-semibold tracking-tight text-white">{metrics.hoursSaved}</p><p className="font-mono-ui mt-0.5 text-[8px] uppercase tracking-[.16em] text-[#6E5F49]">Hours</p></div>
        <div><p className={clsx("font-mono-ui text-[16px] font-semibold tracking-tight", metrics.errors > 0 ? "text-[#F08B72]" : "text-[#94C759]")}>{metrics.errors}</p><p className="font-mono-ui mt-0.5 text-[8px] uppercase tracking-[.16em] text-[#6E5F49]">Issues</p></div>
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-[11px] font-bold text-[#C7F76F]">Configure account <ArrowRight size={12} className="transition group-hover:translate-x-0.5" /></span>
    </button>
  );
}

function AccountDirectory({ clients, loading, error, onOpenAccount, onRefresh }: { clients: AppClient[]; loading: boolean; error: string | null; onOpenAccount: (id: string) => void; onRefresh: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const shown = useMemo(() => clients.filter((client) => {
    const status = displayStatus(client.status);
    const matchesFilter = filter === "All" || status === filter;
    const target = `${client.name} ${client.industry} ${status}`.toLowerCase();
    return matchesFilter && target.includes(query.toLowerCase());
  }), [clients, filter, query]);

  if (loading) return <LoadingState title="Loading account directory..." />;
  if (error) return <ErrorState title="Could not load account directory" error={error} onRetry={onRefresh} />;

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(199,247,111,.09),transparent_34%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge><Building2 size={12} /> Configured accounts</Badge>
            <h1 className="font-display mt-4 max-w-3xl text-3xl font-medium tracking-[-.02em] text-white sm:text-[2.6rem] sm:leading-[1.05]">Choose a business to configure.</h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#94836A]">Each card opens live settings for one client: voice, business brain, quote rules, calendar, routing, fallbacks, compliance, integrations, and testing.</p>
          </div>
          <div className="relative w-full lg:w-[330px]">
            <Search size={14} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#94836A]" />
            <Input value={query} onChange={setQuery} placeholder="Search account cards..." className="pl-9" />
          </div>
        </div>
      </Card>
      <div className="flex flex-wrap gap-2">
        {["All", "Live", "Setup", "Pilot", "Needs Attention", "Paused", "Draft"].map((item) => (
          <FilterPill key={item} label={item} active={filter === item} onClick={() => setFilter(item)} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map((client) => <AccountDirectoryCard key={client.id} client={client} onOpen={() => onOpenAccount(client.id)} />)}</div>
      {shown.length === 0 && <DemoState tone="honey" title="No configured accounts match" description="Clear the search or choose a different account status." />}
    </div>
  );
}

type SetupForm = {
  name: string;
  publicName: string;
  industry: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  timezone: string;
  primaryAddress: string;
  serviceArea: string;
  radiusMiles: string;
  outOfAreaResponse: string;
  phoneChoice: string;
  missedCallFallback: string;
  spamHandling: string;
  voiceChoice: string;
  receptionistName: string;
  agentDisplayName: string;
  greetingScript: string;
  speakingPace: string;
  interruptionStyle: string;
  backgroundAmbience: string;
  disclosurePhrase: string;
  behaviorInstructions: string;
  systemPrompt: string;
  businessSummary: string;
  brandTone: string;
  bookingChoice: string;
  noAvailabilityBehavior: string;
  fallbackChoice: string;
  urgentTriggers: string;
  smsAlertTemplate: string;
  operatorReviewThreshold: string;
  aiDisclosurePolicy: string;
  callRecordingConsentScript: string;
  launchScenarios: string;
};

const defaultSetupForm: SetupForm = {
  name: "",
  publicName: "",
  industry: "Home services",
  primaryContactName: "",
  primaryContactPhone: "",
  primaryContactEmail: "",
  timezone: "America/Denver",
  primaryAddress: "",
  serviceArea: "Salt Lake City",
  radiusMiles: "35",
  outOfAreaResponse: "Politely explain that the business may not service that area and offer to take details for owner review.",
  phoneChoice: "forward",
  missedCallFallback: "Collect caller details and send the owner an SMS summary.",
  spamHandling: "Politely end obvious spam calls and mark the lead as spam.",
  voiceChoice: "elevenlabs",
  receptionistName: "Sam",
  agentDisplayName: "",
  greetingScript: "",
  speakingPace: "Variable, natural, and concise.",
  interruptionStyle: "Allow callers to interrupt and acknowledge before continuing.",
  backgroundAmbience: "None unless explicitly approved.",
  disclosurePhrase: "",
  behaviorInstructions: "Sound human, calm, and helpful. Ask one question at a time. Use tools before confirming booking details. Never invent pricing or availability.",
  systemPrompt: "",
  businessSummary: "",
  brandTone: "warm, brief, professional, local",
  bookingChoice: "direct",
  noAvailabilityBehavior: "Collect preferred windows and alert the owner.",
  fallbackChoice: "owner",
  urgentTriggers: "safety risk\nactive leak\ndoor stuck open\ncaller trapped\nproperty damage\nangry caller",
  smsAlertTemplate: "Urgent Bellory call for {{client_name}}: {{issue}}. Caller: {{caller_phone}}.",
  operatorReviewThreshold: "Escalate low confidence, urgent, or pricing-outside-rules calls.",
  aiDisclosurePolicy: "Use the approved Bellory disclosure phrase when asked and wherever legally required.",
  callRecordingConsentScript: "This call may be recorded so we can help the team follow up accurately.",
  launchScenarios: "normal booking\nurgent transfer\nquote shopper\nafter hours\nno availability\ntool failure fallback",
};

function SetupField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">{label}</p>
      <Input value={value} onChange={onChange} placeholder={`Enter ${label.toLowerCase()}...`} type={type} />
    </div>
  );
}

function SetupTextarea({ label, value, onChange, rows = 5 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <div>
      <p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">{label}</p>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/[.09] bg-[#13100B]/80 p-4 text-sm leading-6 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,.25)] outline-none transition placeholder:text-[#6E5F49] hover:border-white/[.14] focus:border-[#C7F76F]/45"
      />
    </div>
  );
}

export function NewBusinessSetupPage({ onCreateBusiness }: { onCreateBusiness: (payload: CreateClientPayload, configPatch: BelloryClientConfigDraft) => Promise<string> }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultSetupForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const complete = Math.round((step / (setupSteps.length - 1)) * 100);
  const current = setupSteps[step];
  const detail = onboardingDetails[current];

  const update = (key: keyof SetupForm) => (value: string) => setForm((currentForm) => ({ ...currentForm, [key]: value }));
  const createDisabled = !form.name.trim() || !form.industry.trim() || saving;

  const handleCreate = async () => {
    if (createDisabled) {
      setError("Business name and industry are required before creating the account.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onCreateBusiness({
        name: form.name.trim(),
        industry: form.industry.trim(),
        primaryContactName: form.primaryContactName.trim() || undefined,
        primaryContactPhone: form.primaryContactPhone.trim() || undefined,
        primaryContactEmail: form.primaryContactEmail.trim() || undefined,
      }, setupPatch(form));
      setForm(defaultSetupForm);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create business");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[330px_1fr]">
      <Card className="p-4 xl:sticky xl:top-[84px] xl:self-start">
        <div className="mb-5 rounded-xl bg-gradient-to-br from-[#C7F76F]/[.08] to-transparent p-4">
          <div className="flex items-center justify-between">
            <Badge tone="honey">Live draft</Badge>
            <span className="font-mono-ui text-sm font-bold text-[#C7F76F]">{complete}%</span>
          </div>
          <p className="mt-3.5 text-[15px] font-bold tracking-[-.01em] text-white">New business onboarding</p>
          <p className="mt-1 text-[11px] leading-4 text-[#94836A]">Creates a real client and first config draft in Supabase.</p>
          <div className="mt-4"><Progress value={complete} /></div>
        </div>
        <div className="space-y-0.5">
          {setupSteps.map((item, index) => (
            <button
              key={item}
              onClick={() => setStep(index)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold tracking-[-.01em] transition-colors",
                step === index ? "bg-[#C7F76F]/[.08] text-[#D8FF9B]" : index < step ? "text-[#C6B9A6] hover:bg-white/[.03]" : "text-[#94836A] hover:bg-white/[.03] hover:text-[#C6B9A6]",
              )}
            >
              <span className={clsx(
                "font-mono-ui grid size-5 shrink-0 place-items-center rounded-full text-[8px] font-bold",
                index < step ? "bg-[#C7F76F] text-[#14110B]" : step === index ? "border border-[#C7F76F]/40 text-[#C7F76F]" : "bg-white/[.05] text-[#6E5F49]",
              )}>
                {index < step ? <Check size={10} strokeWidth={3} /> : index + 1}
              </span>
              {item}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-7">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono-ui mb-2.5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#94C759]">Step {String(step + 1).padStart(2, "0")} / {setupSteps.length}</p>
            <h2 className="font-display text-2xl font-medium tracking-[-.015em] text-white sm:text-3xl">{detail.title}</h2>
            <p className="mt-2.5 max-w-3xl text-[13px] leading-6 text-[#94836A]">{detail.description}</p>
          </div>
          <IconBox icon={step === setupSteps.length - 1 ? Sparkles : ClipboardCheck} tone={step === setupSteps.length - 1 ? "honey" : "mint"} />
        </div>

        {current === "Phone routing" && (
          <div className="mb-5">
            <ChoiceGrid selected={form.phoneChoice} onSelect={update("phoneChoice")} options={[
              { id: "forward", title: "Forward current number", description: "Fastest launch: business forwards calls to Bellory." },
              { id: "new", title: "Assign Bellory number", description: "Use a Twilio number immediately and optionally advertise it." },
              { id: "port", title: "Port later", description: "Start forwarding, then port the existing number after pilot." },
            ]} />
          </div>
        )}

        {current === "Agent identity & prompt" && (
          <div className="mb-5">
            <ChoiceGrid selected={form.voiceChoice} onSelect={update("voiceChoice")} options={[
              { id: "elevenlabs", title: "ElevenLabs agent", description: "Use the most human voice profile and live call agent config." },
              { id: "template", title: "Copy Bellory template", description: "Start from the Bellory base agent, then customize the name and prompt." },
              { id: "custom", title: "Custom client agent", description: "Use a dedicated agent when the customer needs deeper behavior changes." },
            ]} />
          </div>
        )}

        {current === "Calendar & dispatch" && (
          <div className="mb-5">
            <ChoiceGrid selected={form.bookingChoice} onSelect={update("bookingChoice")} options={[
              { id: "direct", title: "Book directly", description: "AI books when all rules match and calendar has availability." },
              { id: "approval", title: "Owner approval", description: "AI collects details and holds appointment until approved." },
              { id: "lead", title: "Lead only", description: "AI captures qualified jobs without committing a time." },
            ]} />
          </div>
        )}

        {current === "Urgency & escalation" && (
          <div className="mb-5">
            <ChoiceGrid selected={form.fallbackChoice} onSelect={update("fallbackChoice")} options={[
              { id: "owner", title: "Owner first", description: "Transfer urgent calls to owner, then SMS summary." },
              { id: "manager", title: "Manager first", description: "Use office manager for scheduling or pricing uncertainty." },
              { id: "bellory", title: "Bellory operator", description: "Route ambiguous calls to an internal Bellory operator." },
            ]} />
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {current === "Business identity" && (
            <>
              <SetupField label="Legal business name" value={form.name} onChange={update("name")} />
              <SetupField label="Caller-facing name" value={form.publicName} onChange={update("publicName")} />
              <SetupField label="Industry" value={form.industry} onChange={update("industry")} />
              <SetupField label="Owner name" value={form.primaryContactName} onChange={update("primaryContactName")} />
              <SetupField label="Owner phone" value={form.primaryContactPhone} onChange={update("primaryContactPhone")} />
              <SetupField label="Owner email" value={form.primaryContactEmail} onChange={update("primaryContactEmail")} type="email" />
              <SetupField label="Timezone" value={form.timezone} onChange={update("timezone")} />
              <SetupField label="Brand tone" value={form.brandTone} onChange={update("brandTone")} />
            </>
          )}
          {current === "Locations & hours" && (
            <>
              <SetupField label="Primary address" value={form.primaryAddress} onChange={update("primaryAddress")} />
              <SetupField label="Primary service city" value={form.serviceArea} onChange={update("serviceArea")} />
              <SetupField label="Service radius miles" value={form.radiusMiles} onChange={update("radiusMiles")} type="number" />
              <SetupField label="Out-of-area response" value={form.outOfAreaResponse} onChange={update("outOfAreaResponse")} />
            </>
          )}
          {current === "Phone routing" && (
            <>
              <SetupField label="Current / owner phone" value={form.primaryContactPhone} onChange={update("primaryContactPhone")} />
              <SetupField label="Missed-call fallback" value={form.missedCallFallback} onChange={update("missedCallFallback")} />
              <SetupField label="Spam handling" value={form.spamHandling} onChange={update("spamHandling")} />
            </>
          )}
          {current === "Agent identity & prompt" && (
            <>
              <SetupField label="Receptionist name" value={form.receptionistName} onChange={update("receptionistName")} />
              <SetupField label="ElevenLabs agent display name" value={form.agentDisplayName} onChange={update("agentDisplayName")} />
              <SetupField label="Speaking pace" value={form.speakingPace} onChange={update("speakingPace")} />
              <SetupField label="Interruption style" value={form.interruptionStyle} onChange={update("interruptionStyle")} />
              <SetupField label="Background ambience" value={form.backgroundAmbience} onChange={update("backgroundAmbience")} />
              <SetupField label="Disclosure phrase" value={form.disclosurePhrase} onChange={update("disclosurePhrase")} />
            </>
          )}
          {current === "Calendar & dispatch" && (
            <>
              <SetupField label="No availability behavior" value={form.noAvailabilityBehavior} onChange={update("noAvailabilityBehavior")} />
            </>
          )}
          {current === "Compliance & policies" && (
            <>
              <SetupField label="AI disclosure policy" value={form.aiDisclosurePolicy} onChange={update("aiDisclosurePolicy")} />
              <SetupField label="Recording consent script" value={form.callRecordingConsentScript} onChange={update("callRecordingConsentScript")} />
            </>
          )}
        </div>

        <div className="mt-4 grid gap-4">
          {current === "Business identity" && <SetupTextarea label="Business summary" value={form.businessSummary} onChange={update("businessSummary")} />}
          {current === "Agent identity & prompt" && (
            <>
              <SetupTextarea label="Greeting script" value={form.greetingScript} onChange={update("greetingScript")} rows={3} />
              <SetupTextarea label="Behavior instructions" value={form.behaviorInstructions} onChange={update("behaviorInstructions")} />
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">System prompt</p>
                  <Button
                    kind="secondary"
                    onClick={() => setForm((currentForm) => {
                      const businessName = currentForm.publicName || currentForm.name || "the business";
                      const receptionistName = currentForm.receptionistName || "Sam";
                      return {
                        ...currentForm,
                        agentDisplayName: currentForm.agentDisplayName || `${receptionistName} - ${businessName}`,
                        disclosurePhrase: currentForm.disclosurePhrase || `Yes, I'm ${receptionistName}, the AI receptionist for ${businessName}. I can help get your information over, check scheduling, or forward you to someone if needed.`,
                        systemPrompt: buildDefaultAgentSystemPrompt({ receptionistName, businessName }),
                      };
                    })}
                  >
                    Generate prompt
                  </Button>
                </div>
                <textarea
                  rows={14}
                  value={form.systemPrompt || buildDefaultAgentSystemPrompt({ receptionistName: form.receptionistName, businessName: form.publicName || form.name || "the business" })}
                  onChange={(event) => update("systemPrompt")(event.target.value)}
                  className="font-mono-ui w-full rounded-xl border border-white/[.09] bg-[#13100B]/80 p-4 text-xs leading-5 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,.25)] outline-none transition placeholder:text-[#6E5F49] hover:border-white/[.14] focus:border-[#C7F76F]/45"
                />
                <p className="mt-1.5 text-[10px] leading-4 text-[#94836A]">This is the exact system prompt to paste into the ElevenLabs agent for this business.</p>
              </div>
            </>
          )}
          {current === "Urgency & escalation" && (
            <>
              <SetupTextarea label="Urgent triggers, one per line" value={form.urgentTriggers} onChange={update("urgentTriggers")} rows={5} />
              <SetupTextarea label="SMS alert template" value={form.smsAlertTemplate} onChange={update("smsAlertTemplate")} rows={3} />
              <SetupTextarea label="Operator review threshold" value={form.operatorReviewThreshold} onChange={update("operatorReviewThreshold")} rows={3} />
            </>
          )}
          {current === "Launch QA" && <SetupTextarea label="Required launch scenarios, one per line" value={form.launchScenarios} onChange={update("launchScenarios")} rows={6} />}
        </div>

        {!(["Business identity", "Locations & hours", "Phone routing", "Agent identity & prompt", "Calendar & dispatch", "Urgency & escalation", "Compliance & policies", "Launch QA"] as SetupStep[]).includes(current) && (
          <div className="grid gap-3 md:grid-cols-2">
            {detail.fields.map((field) => <EmptyCheck key={field} text={field} />)}
          </div>
        )}

        <BackendMapping label={detail.backend} checks={detail.checklist} />
        {error && <div className="mt-4"><DemoState title="Setup needs attention" description={error} tone="coral" /></div>}

        <div className="mt-6 flex justify-between border-t border-white/[.06] pt-5">
          <Button kind="ghost" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>Back</Button>
          {step < setupSteps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>Save & continue <ArrowRight size={13} /></Button>
          ) : (
            <Button disabled={createDisabled} onClick={handleCreate}><Sparkles size={14} /> {saving ? "Creating..." : "Create live account"}</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function EditableField({ config, path, label, onChange, type = "text", helper }: { config: BelloryClientConfigDraft | null; path: string; label: string; onChange: (path: string, value: unknown) => void; type?: string; helper?: string }) {
  const value = type === "number" ? String(getNumber(config, path)) : getString(config, path);

  return (
    <div>
      <p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">{label}</p>
      <Input value={value} type={type} onChange={(next) => onChange(path, type === "number" ? Number(next) || 0 : next)} />
      {helper && <p className="mt-1.5 text-[10px] leading-4 text-[#94836A]">{helper}</p>}
    </div>
  );
}

function EditableTextArea({ config, path, label, onChange, rows = 5 }: { config: BelloryClientConfigDraft | null; path: string; label: string; onChange: (path: string, value: unknown) => void; rows?: number }) {
  return (
    <div>
      <p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">{label}</p>
      <textarea
        rows={rows}
        value={getString(config, path)}
        onChange={(event) => onChange(path, event.target.value)}
        className="w-full rounded-xl border border-white/[.09] bg-[#13100B]/80 p-4 text-sm leading-6 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,.25)] outline-none transition placeholder:text-[#6E5F49] hover:border-white/[.14] focus:border-[#C7F76F]/45"
      />
    </div>
  );
}

function EditableList({ config, path, label, onChange, rows = 5 }: { config: BelloryClientConfigDraft | null; path: string; label: string; onChange: (path: string, value: unknown) => void; rows?: number }) {
  return (
    <div>
      <p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">{label}</p>
      <textarea
        rows={rows}
        value={getStringArray(config, path).join("\n")}
        onChange={(event) => onChange(path, splitLines(event.target.value))}
        className="w-full rounded-xl border border-white/[.09] bg-[#13100B]/80 p-4 text-sm leading-6 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,.25)] outline-none transition placeholder:text-[#6E5F49] hover:border-white/[.14] focus:border-[#C7F76F]/45"
      />
      <p className="mt-1.5 text-[10px] leading-4 text-[#94836A]">One item per line.</p>
    </div>
  );
}

function SelectField({ config, path, label, options, onChange }: { config: BelloryClientConfigDraft | null; path: string; label: string; options: string[]; onChange: (path: string, value: unknown) => void }) {
  return (
    <div>
      <p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">{label}</p>
      <Select value={getString(config, path)} onChange={(value) => onChange(path, value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </Select>
    </div>
  );
}

function BooleanSelect({ config, path, label, onChange }: { config: BelloryClientConfigDraft | null; path: string; label: string; onChange: (path: string, value: unknown) => void }) {
  return (
    <div>
      <p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">{label}</p>
      <Select value={getString(config, path, "false")} onChange={(value) => onChange(path, value === "true")}>
        <option value="false">false</option>
        <option value="true">true</option>
      </Select>
    </div>
  );
}

function JsonEditor({ config, path, label, onChange }: { config: BelloryClientConfigDraft | null; path: string; label: string; onChange: (path: string, value: unknown) => void }) {
  const value = getJsonValue(config, path);
  const valueText = JSON.stringify(value, null, 2);
  const [draftText, setDraftText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const text = draftText ?? valueText;

  const apply = () => {
    try {
      onChange(path, JSON.parse(text));
      setDraftText(null);
      setError(null);
    } catch {
      setError("Invalid JSON. Fix the structure before saving.");
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">{label}</p>
        <Button kind="ghost" onClick={apply}>Apply JSON</Button>
      </div>
      <textarea
        rows={8}
        value={text}
        onChange={(event) => setDraftText(event.target.value)}
        onBlur={apply}
        className="font-mono-ui w-full rounded-xl border border-white/[.09] bg-[#13100B]/80 p-4 text-xs leading-5 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,.25)] outline-none transition placeholder:text-[#6E5F49] hover:border-white/[.14] focus:border-[#C7F76F]/45"
      />
      {error && <p className="mt-1.5 text-[11px] text-[#F08B72]">{error}</p>}
    </div>
  );
}

function ValidationPanel({ validation }: { validation: ValidationResult | null }) {
  if (!validation) return null;
  if (validation.ok) return <DemoState title="Validation passed" description="This config is publishable for the live receptionist runtime." />;

  return (
    <div className="rounded-2xl border border-[#E05F45]/20 bg-[#E05F45]/10 p-4">
      <p className="text-[12px] font-bold text-[#F08B72]">Validation issues</p>
      <div className="mt-3 space-y-2">
        {validation.issues.slice(0, 8).map((issue) => <p key={issue} className="text-[11px] leading-5 text-[#F8C2B6]">{issue}</p>)}
      </div>
    </div>
  );
}

function CalendarConnectionCard({ clientId }: { clientId: string }) {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      getCalendarStatus(clientId)
        .then((next) => { if (!ignore) setStatus(next); })
        .catch((caught) => { if (!ignore) setError(caught instanceof Error ? caught.message : "Unable to load calendar status"); });
    });
    return () => { ignore = true; };
  }, [clientId]);

  const tone: StatusTone = status?.connected ? "mint" : status?.status === "issue" ? "coral" : "honey";
  const label = status?.connected ? "Connected" : status?.status === "issue" ? "Needs Reconnect" : "Not Connected";

  return (
    <ConfigPanel title="Google Calendar connection" eyebrow="Real availability and booking" icon={CalendarCheck} tone={status?.connected ? "mint" : "honey"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone={tone}>{label}</Badge>
            {status?.email && <span className="font-mono-ui text-[11px] text-[#94836A]">{status.email}</span>}
          </div>
          <p className="mt-2 max-w-xl text-[12px] leading-5 text-[#94836A]">
            {status?.connected
              ? "Availability checks exclude real busy time, and confirmed bookings create calendar events."
              : status?.status === "issue"
                ? "Google rejected the stored credentials. Reconnect to restore real availability; rules-only mode is active meanwhile."
                : "Until a calendar is connected, availability comes from business-hours rules only."}
          </p>
          {error && <p className="mt-2 text-[11px] text-[#F08B72]">{error}</p>}
        </div>
        <a
          href={`/api/google/oauth/start?clientId=${clientId}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C7F76F] px-3.5 py-2.5 text-[13px] font-bold text-[#14110B] transition hover:bg-[#D8FF9B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/45"
        >
          <CalendarCheck size={14} /> {status?.connected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
        </a>
      </div>
    </ConfigPanel>
  );
}

function activityTone(status: string): StatusTone {
  const value = status.toLowerCase();
  if (["booked", "completed", "success", "new"].includes(value)) return "mint";
  if (["failed", "lost", "spam", "high", "failure"].includes(value)) return "coral";
  if (["needs_approval", "held", "needs_owner", "qualifying", "medium", "transferred", "in_progress"].includes(value)) return "honey";
  return "muted";
}

function formatActivityTime(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "—";
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function ClientActivityPanel({ clientId }: { clientId: string }) {
  const [activity, setActivity] = useState<ClientActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getClientActivity(clientId)
      .then(setActivity)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load activity"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      if (ignore) return;
      load();
    });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (loading) return <LoadingState title="Loading calls, leads, and appointments..." />;
  if (error) return <ErrorState title="Could not load activity" error={error} onRetry={load} />;
  if (!activity) return null;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="border-b border-white/[.06] p-5">
          <SectionTitle
            title="Recent calls"
            eyebrow="From the ElevenLabs post-call webhook"
            action={<Button kind="secondary" onClick={load}><PhoneIncoming size={13} /> Refresh</Button>}
          />
        </div>
        {activity.calls.map((call) => (
          <div key={call.id} className="grid gap-3 border-t border-white/[.05] px-5 py-4 lg:grid-cols-[130px_1fr_110px_90px_110px] lg:items-center">
            <span className="font-mono-ui text-[11px] text-[#94836A]">{formatActivityTime(call.startedAt ?? call.createdAt)}</span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold tracking-[-.01em] text-white">{call.callerName || call.callerPhone || "Unknown caller"}</p>
              <p className="mt-1 truncate text-[11px] leading-5 text-[#94836A]">{call.summary || "No summary yet."}</p>
            </div>
            <span><Badge tone={activityTone(call.status)}>{displayStatus(call.status)}</Badge></span>
            <span className="font-mono-ui text-[12px] text-[#C6B9A6]">{formatDuration(call.durationSeconds)}</span>
            <span className="font-mono-ui truncate text-[11px] text-[#94836A]">{call.outcome ? displayStatus(call.outcome) : "—"}</span>
          </div>
        ))}
        {activity.calls.length === 0 && (
          <div className="p-5">
            <DemoState tone="honey" title="No calls yet" description="Calls appear here after the ElevenLabs post-call webhook delivers the first conversation for this client." />
          </div>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-white/[.06] p-5"><SectionTitle title="Appointments" eyebrow="Booked and pending" /></div>
          {activity.appointments.map((appointment) => (
            <div key={appointment.id} className="grid gap-2 border-t border-white/[.05] px-5 py-4 sm:grid-cols-[150px_1fr_130px] sm:items-center">
              <span className="font-mono-ui text-[11px] text-[#94836A]">{formatActivityTime(appointment.startsAt)}</span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold tracking-[-.01em] text-white">{appointment.callerName || appointment.callerPhone || "Unknown caller"}</p>
                <p className="mt-1 truncate text-[11px] text-[#94836A]">{appointment.serviceSummary || "No service summary."}</p>
              </div>
              <span className="sm:justify-self-end"><Badge tone={activityTone(appointment.status)}>{displayStatus(appointment.status)}</Badge></span>
            </div>
          ))}
          {activity.appointments.length === 0 && (
            <div className="p-5"><DemoState tone="honey" title="No appointments yet" description="Appointments created by the booking tools will appear here." /></div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-white/[.06] p-5"><SectionTitle title="Leads" eyebrow="Captured by the receptionist" /></div>
          {activity.leads.map((lead) => (
            <div key={lead.id} className="grid gap-2 border-t border-white/[.05] px-5 py-4 sm:grid-cols-[1fr_90px_110px] sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold tracking-[-.01em] text-white">{lead.name || lead.phone}</p>
                <p className="mt-1 truncate text-[11px] text-[#94836A]">{lead.issue || lead.summary || lead.phone}</p>
              </div>
              <span><Badge tone={activityTone(lead.urgency)}>{displayStatus(lead.urgency)}</Badge></span>
              <span className="sm:justify-self-end"><Badge tone={activityTone(lead.status)}>{displayStatus(lead.status)}</Badge></span>
            </div>
          ))}
          {activity.leads.length === 0 && (
            <div className="p-5"><DemoState tone="honey" title="No leads yet" description="Leads saved by the receptionist during calls will appear here." /></div>
          )}
        </Card>
      </div>
    </div>
  );
}

function AccountTabContent({
  tab,
  client,
  config,
  readiness,
  validation,
  onChange,
  onDownloadKnowledgeBase,
  knowledgeBaseBusy,
  knowledgeBaseDisabled,
  knowledgeBaseNeedsSave,
  onSyncAgent,
  agentSyncBusy,
  agentSyncDisabled,
}: {
  tab: AccountTab;
  client: AppClient;
  config: BelloryClientConfigDraft | null;
  readiness: Readiness;
  validation: ValidationResult | null;
  onChange: (path: string, value: unknown) => void;
  onDownloadKnowledgeBase: () => void;
  knowledgeBaseBusy: boolean;
  knowledgeBaseDisabled: boolean;
  knowledgeBaseNeedsSave: boolean;
  onSyncAgent: () => void;
  agentSyncBusy: boolean;
  agentSyncDisabled: boolean;
}) {
  const metrics = getMetrics(client);

  if (tab === "Overview") {
    const sectionStatus = Object.entries(readiness.sectionStatus ?? {});
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Brain} label="Config readiness" value={`${readiness.percentage}%`} helper={`${readiness.complete} of ${readiness.required} required settings complete`} />
          <MetricCard icon={PhoneIncoming} label="Calls answered" value={`${metrics.callsAnswered}`} helper="Live calls Bellory picked up" tone="blue" />
          <MetricCard icon={CalendarCheck} label="Jobs saved" value={`${metrics.jobsSaved}`} helper="Booked or escalated work" tone="honey" />
          <MetricCard icon={TriangleAlert} label="Open issues" value={`${metrics.errors}`} helper={metrics.lastIssue} tone={metrics.errors > 0 ? "coral" : "mint"} />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <ConfigPanel title="Configuration checklist" eyebrow="Live readiness" icon={ListChecks}>
            <div className="grid gap-2 md:grid-cols-2">
              {sectionStatus.map(([key, status]) => (
                <EmptyCheck key={key} checked={status.complete} text={`${sectionLabels[key] ?? key}${status.missing.length ? ` - missing ${status.missing.length}` : ""}`} />
              ))}
            </div>
          </ConfigPanel>
          <ConfigPanel title="Routing summary" eyebrow="Current draft" icon={Route} tone="blue">
            <div className="space-y-2">
              <DemoState title="Phone mode" description={getString(config, "phoneRouting.mode", "Not configured")} />
              <DemoState title="Calendar mode" description={getString(config, "calendarAndDispatch.bookingMode", "Not configured")} tone="honey" />
              <DemoState title="Fallback" description={getString(config, "phoneRouting.missedCallFallback", "Not configured")} />
            </div>
          </ConfigPanel>
        </div>
        <ValidationPanel validation={validation} />
      </div>
    );
  }

  if (tab === "Business Brain") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Business facts" eyebrow="Core memory" icon={Building2}>
          <div className="grid gap-3 md:grid-cols-2">
            <EditableField config={config} path="businessIdentity.legalName" label="Legal name" onChange={onChange} />
            <EditableField config={config} path="businessIdentity.publicName" label="Caller-facing name" onChange={onChange} />
            <EditableField config={config} path="businessIdentity.industry" label="Industry" onChange={onChange} />
            <EditableField config={config} path="businessIdentity.ownerName" label="Owner name" onChange={onChange} />
            <EditableField config={config} path="businessIdentity.ownerPhone" label="Owner phone" onChange={onChange} />
            <EditableField config={config} path="businessIdentity.ownerEmail" label="Owner email" onChange={onChange} />
            <EditableField config={config} path="businessIdentity.timezone" label="Timezone" onChange={onChange} />
          </div>
          <div className="mt-4 grid gap-4">
            <EditableList config={config} path="businessIdentity.brandTone" label="Brand tone words" onChange={onChange} rows={4} />
            <EditableTextArea config={config} path="businessIdentity.businessSummary" label="Business summary used by AI" onChange={onChange} />
          </div>
        </ConfigPanel>
        <ConfigPanel title="Receptionist brain" eyebrow="Runtime instructions" icon={UsersRound} tone="honey">
          <div className="space-y-4">
            <EditableList config={config} path="receptionistBrain.callerIntents" label="Caller intents" onChange={onChange} />
            <EditableList config={config} path="receptionistBrain.requiredIntakeFields" label="Required intake fields" onChange={onChange} />
            <EditableTextArea config={config} path="receptionistBrain.lowConfidencePolicy" label="Low-confidence policy" onChange={onChange} rows={4} />
          </div>
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Agent & Prompt") {
    const receptionistName = getString(config, "aiVoice.receptionistName", "Sam");
    const businessName = getString(config, "businessIdentity.publicName", client.name);
    const regeneratePrompt = () => {
      onChange("aiVoice.agentDisplayName", getString(config, "aiVoice.agentDisplayName") || `${receptionistName} - ${businessName}`);
      onChange("aiVoice.disclosurePhrase", getString(config, "aiVoice.disclosurePhrase") || `Yes, I'm ${receptionistName}, the AI receptionist for ${businessName}. I can help get your information over, check scheduling, or forward you to someone if needed.`);
      onChange("aiVoice.systemPrompt", buildDefaultAgentSystemPrompt({ receptionistName, businessName }));
    };

    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel
          title="Agent identity and system prompt"
          eyebrow="ElevenLabs agent profile"
          icon={Headphones}
          action={(
            <div className="flex flex-wrap gap-2">
              <Button kind="secondary" onClick={regeneratePrompt}><FileText size={13} /> Generate prompt</Button>
              <Button disabled={agentSyncDisabled} onClick={onSyncAgent}><Headphones size={13} /> {agentSyncBusy ? "Syncing..." : "Sync to ElevenLabs"}</Button>
            </div>
          )}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField config={config} path="aiVoice.provider" label="Voice provider" options={["elevenlabs"]} onChange={onChange} />
            <EditableField config={config} path="aiVoice.providerAccountId" label="Provider account ID" onChange={onChange} />
            <EditableField config={config} path="aiVoice.receptionistName" label="Receptionist name" onChange={onChange} />
            <EditableField config={config} path="aiVoice.agentDisplayName" label="ElevenLabs agent display name" onChange={onChange} />
            <EditableField config={config} path="aiVoice.externalAgentId" label="External agent ID" onChange={onChange} />
            <EditableField config={config} path="aiVoice.externalVoiceId" label="External voice ID" onChange={onChange} />
            <EditableField config={config} path="aiVoice.speakingPace" label="Speaking pace" onChange={onChange} />
            <EditableField config={config} path="aiVoice.interruptionStyle" label="Interruption style" onChange={onChange} />
            <EditableField config={config} path="aiVoice.backgroundAmbience" label="Background ambience" onChange={onChange} />
            <EditableField config={config} path="aiVoice.disclosurePhrase" label="Disclosure phrase" onChange={onChange} />
          </div>
          <div className="mt-4 grid gap-4">
            <EditableTextArea config={config} path="aiVoice.greetingScript" label="Greeting script" onChange={onChange} rows={3} />
            <EditableTextArea config={config} path="aiVoice.behaviorInstructions" label="Behavior instructions" onChange={onChange} />
            <EditableTextArea config={config} path="aiVoice.systemPrompt" label="System prompt for ElevenLabs" onChange={onChange} rows={18} />
          </div>
        </ConfigPanel>
        <ConfigPanel title="Agent setup order" eyebrow="Step-by-step" icon={SlidersHorizontal} tone="violet">
          <ChecklistGrid items={["Name the receptionist", "Generate the system prompt", "Paste prompt into ElevenLabs", "Upload the KB doc", "Assign voice and phone number", "Configure tools", "Run launch QA calls", "Publish only after test calls pass"]} />
          <div className="mt-4">
            <DemoState title="Prompt vs knowledge base" description="The system prompt controls behavior and the KB document holds business facts. Keep both updated for every client agent." tone="honey" />
          </div>
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Call Flow") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Phone route and call behavior" eyebrow="Runtime flow" icon={MessageSquareText}>
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField config={config} path="phoneRouting.mode" label="Phone routing mode" options={["forward_existing", "new_number", "port_later"]} onChange={onChange} />
            <EditableField config={config} path="phoneRouting.currentNumber" label="Current number" onChange={onChange} />
            <EditableField config={config} path="phoneRouting.belloryNumber" label="Bellory number" onChange={onChange} />
            <EditableField config={config} path="phoneRouting.callerIdLabel" label="Caller ID label" onChange={onChange} />
            <SelectField config={config} path="phoneRouting.recordingConsentMode" label="Recording consent mode" options={["one_party", "two_party", "disabled", "custom"]} onChange={onChange} />
            <EditableField config={config} path="phoneRouting.spamHandling" label="Spam handling" onChange={onChange} />
          </div>
          <div className="mt-4">
            <EditableTextArea config={config} path="phoneRouting.missedCallFallback" label="Failed tool / missed-call fallback" onChange={onChange} rows={4} />
          </div>
        </ConfigPanel>
        <ConfigPanel title="Conversation stages" eyebrow="What the AI must do" icon={PhoneForwarded} tone="blue">
          <ChecklistGrid items={["Answer with approved greeting", "Classify caller intent", "Collect required intake fields", "Check service area", "Determine urgency", "Use calendar/pricing tools", "Confirm next step", "Send owner/client summary"]} />
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Services & Pricing") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <ConfigPanel title="Service catalog" eyebrow={client.industry} icon={Wrench}>
            <JsonEditor config={config} path="servicesAndPricing.services" label="Services JSON" onChange={onChange} />
          </ConfigPanel>
          <ConfigPanel title="Diagnostic fees" eyebrow="Pricing safety" icon={ShieldCheck} tone="honey">
            <JsonEditor config={config} path="servicesAndPricing.diagnosticFees" label="Diagnostic fees JSON" onChange={onChange} />
          </ConfigPanel>
          <ConfigPanel title="Approval threshold" eyebrow="Owner approval" icon={ListChecks} tone="blue">
            <EditableField config={config} path="servicesAndPricing.ownerApprovalThresholdCents" label="Owner approval threshold cents" type="number" onChange={onChange} />
          </ConfigPanel>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ConfigPanel title="Quote guardrails" eyebrow="What Bellory may say" icon={Database} tone="violet">
            <EditableList config={config} path="servicesAndPricing.quoteGuardrails" label="Quote guardrails" onChange={onChange} />
          </ConfigPanel>
          <ConfigPanel title="Never quote conditions" eyebrow="Escalate instead" icon={TriangleAlert} tone="coral">
            <EditableList config={config} path="servicesAndPricing.neverQuoteConditions" label="Never-quote conditions" onChange={onChange} />
          </ConfigPanel>
        </div>
      </div>
    );
  }

  if (tab === "Calendar & Dispatch") {
    return (
      <div className="space-y-4">
      <CalendarConnectionCard clientId={client.id} />
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Booking rules" eyebrow="Calendar and dispatch" icon={CalendarCheck}>
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField config={config} path="calendarAndDispatch.provider" label="Calendar provider" options={["google", "manual", "none"]} onChange={onChange} />
            <SelectField config={config} path="calendarAndDispatch.bookingMode" label="Booking mode" options={["direct", "owner_approval", "lead_only"]} onChange={onChange} />
            <EditableField config={config} path="calendarAndDispatch.travelBufferMinutes" label="Travel buffer minutes" type="number" onChange={onChange} />
            <EditableField config={config} path="calendarAndDispatch.appointmentWindowWording" label="Appointment window wording" onChange={onChange} />
          </div>
          <div className="mt-4 grid gap-4">
            <JsonEditor config={config} path="calendarAndDispatch.appointmentTypes" label="Appointment types JSON" onChange={onChange} />
            <EditableTextArea config={config} path="calendarAndDispatch.noAvailabilityBehavior" label="No-availability behavior" onChange={onChange} rows={4} />
          </div>
        </ConfigPanel>
        <ConfigPanel title="Dispatch intelligence" eyebrow="Job assignment" icon={MapPinned} tone="honey">
          <EditableList config={config} path="calendarAndDispatch.technicianRoutingRules" label="Technician routing rules" onChange={onChange} rows={7} />
        </ConfigPanel>
      </div>
      </div>
    );
  }

  if (tab === "Urgency & Fallbacks") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Urgency triggers" eyebrow="Escalation rules" icon={TriangleAlert} tone="coral">
          <EditableList config={config} path="urgencyAndEscalation.urgentTriggers" label="Urgent triggers" onChange={onChange} rows={8} />
        </ConfigPanel>
        <ConfigPanel title="Fallback route" eyebrow="Human handoff" icon={PhoneForwarded} tone="honey">
          <div className="space-y-4">
            <EditableField config={config} path="urgencyAndEscalation.primaryFallbackContactId" label="Primary fallback contact ID" onChange={onChange} />
            <EditableField config={config} path="urgencyAndEscalation.secondaryFallbackContactId" label="Secondary fallback contact ID" onChange={onChange} />
            <EditableTextArea config={config} path="urgencyAndEscalation.smsAlertTemplate" label="SMS alert template" onChange={onChange} rows={4} />
            <EditableTextArea config={config} path="urgencyAndEscalation.operatorReviewThreshold" label="Operator review threshold" onChange={onChange} rows={4} />
          </div>
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Knowledge Base") {
    return (
      <div className="space-y-4">
        <ConfigPanel
          title="ElevenLabs knowledge document"
          eyebrow="Agent upload"
          icon={FileText}
          tone="honey"
          action={
            <Button kind="secondary" disabled={knowledgeBaseDisabled} onClick={onDownloadKnowledgeBase}>
              <FileText size={13} /> {knowledgeBaseBusy ? "Creating..." : "Download KB doc"}
            </Button>
          }
        >
          <p className="max-w-3xl text-[13px] leading-6 text-[#B7AB98]">
            Bellory turns this account setup into a clean Markdown knowledge base for the ElevenLabs agent. Upload the downloaded file in ElevenLabs under Knowledge Base - Add document, then run a test call and ask questions about pricing, urgency, hours, service area, and booking rules.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <DemoState title="1. Finish setup" description="Services, pricing, intake, hours, fallback, and compliance become the source facts." tone="honey" />
            <DemoState title="2. Download document" description="The generated file uses plain sections and bullets so the agent can retrieve it cleanly." />
            <DemoState title="3. Upload and test" description="Attach the file to the matching ElevenLabs agent, then test realistic caller scenarios." />
          </div>
          {knowledgeBaseNeedsSave && <p className="mt-3 text-[11px] font-semibold text-[#F6C66A]">Unsaved edits will be saved before Bellory creates the document.</p>}
          {!config && <p className="mt-3 text-[11px] font-semibold text-[#F08B72]">Load or create an account configuration before exporting a knowledge document.</p>}
        </ConfigPanel>
        <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
          <ConfigPanel title="FAQs and knowledge" eyebrow="AI memory" icon={Brain}>
            <JsonEditor config={config} path="receptionistBrain.faqs" label="FAQs JSON" onChange={onChange} />
            <div className="mt-4">
              <EditableList config={config} path="receptionistBrain.wordsToAvoid" label="Words to avoid" onChange={onChange} rows={4} />
            </div>
          </ConfigPanel>
          <ConfigPanel title="Forbidden claims" eyebrow="Guardrails" icon={Database} tone="blue">
            <EditableList config={config} path="receptionistBrain.forbiddenClaims" label="Forbidden claims" onChange={onChange} rows={8} />
          </ConfigPanel>
        </div>
      </div>
    );
  }

  if (tab === "Compliance") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Required policy controls" eyebrow="Safety and trust" icon={ShieldCheck}>
          <div className="grid gap-3 md:grid-cols-2">
            <EditableField config={config} path="complianceAndPolicies.dataRetentionDays" label="Data retention days" type="number" onChange={onChange} />
            <EditableField config={config} path="complianceAndPolicies.paymentInfoPolicy" label="Payment info policy" onChange={onChange} />
          </div>
          <div className="mt-4 grid gap-4">
            <EditableTextArea config={config} path="complianceAndPolicies.aiDisclosurePolicy" label="AI disclosure policy" onChange={onChange} rows={4} />
            <EditableTextArea config={config} path="complianceAndPolicies.callRecordingConsentScript" label="Call recording consent script" onChange={onChange} rows={4} />
            <EditableTextArea config={config} path="complianceAndPolicies.complaintHandlingScript" label="Complaint handling script" onChange={onChange} rows={4} />
          </div>
        </ConfigPanel>
        <ConfigPanel title="Never say / never do" eyebrow="Guardrails" icon={KeyRound} tone="coral">
          <div className="space-y-4">
            <EditableList config={config} path="complianceAndPolicies.safetyDisclaimerRules" label="Safety disclaimer rules" onChange={onChange} />
            <EditableList config={config} path="complianceAndPolicies.prohibitedAdvice" label="Prohibited advice" onChange={onChange} />
          </div>
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Integrations") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["ElevenLabs", "integrations.elevenLabs", "Voice agent, transcript, post-call webhook", Headphones],
          ["Twilio", "integrations.twilio", "Phone number, forwarding, recording, SMS", PhoneForwarded],
          ["Google Calendar", "integrations.googleCalendar", "Availability, holds, booking, reschedules", CalendarCheck],
          ["CRM / job system", "integrations.crm", "Lead handoff, job status, customer history", Database],
        ].map(([name, path, detail, icon]) => (
          <ConfigPanel key={name as string} title={name as string} eyebrow={getString(config, `${path}.status`, "not_connected")} icon={icon as LucideIcon} tone={getString(config, `${path}.status`) === "issue" ? "coral" : getString(config, `${path}.status`) === "connected" ? "mint" : "honey"}>
            <p className="text-[12px] leading-5 text-[#B7AB98]">{detail as string}</p>
            <div className="mt-4 grid gap-3">
              <SelectField config={config} path={`${path}.status`} label="Status" options={["not_connected", "connected", "issue", "disabled", "planned"]} onChange={onChange} />
              <EditableField config={config} path={`${path}.provider`} label="Provider" onChange={onChange} />
              <EditableField config={config} path={`${path}.externalAgentId`} label="External agent ID" onChange={onChange} />
              <EditableField config={config} path={`${path}.phoneNumberId`} label="Phone number ID" onChange={onChange} />
              <EditableField config={config} path={`${path}.connectionId`} label="Connection ID" onChange={onChange} />
            </div>
          </ConfigPanel>
        ))}
      </div>
    );
  }

  if (tab === "Testing") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Required launch test calls" eyebrow="Quality gates" icon={Sparkles}>
          <EditableList config={config} path="launchQa.requiredScenarios" label="Required scenarios" onChange={onChange} rows={8} />
        </ConfigPanel>
        <ConfigPanel title="Pass criteria" eyebrow="Before publish" icon={ListChecks} tone="honey">
          <div className="space-y-4">
            <BooleanSelect config={config} path="launchQa.passed" label="Launch QA passed" onChange={onChange} />
            <EditableField config={config} path="launchQa.lastRunId" label="Last eval run ID" onChange={onChange} />
            <EditableField config={config} path="launchQa.approvedByUserId" label="Approved by user ID" onChange={onChange} />
          </div>
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Calls & Jobs") {
    return <ClientActivityPanel clientId={client.id} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard icon={PhoneIncoming} label="Calls answered" value={`${metrics.callsAnswered}`} helper="Calls Bellory picked up" />
      <MetricCard icon={CalendarCheck} label="Jobs saved" value={`${metrics.jobsSaved}`} helper="Booked or escalated" tone="blue" />
      <MetricCard icon={Clock3} label="Hours saved" value={`${metrics.hoursSaved}`} helper="Estimated admin time saved" tone="honey" />
      <MetricCard icon={Gauge} label="Revenue influenced" value={metrics.revenueSaved} helper="Estimated booked job value" tone="violet" />
    </div>
  );
}

export function AccountDetailPage({
  accountId,
  clients,
  loading,
  error,
  onOpenAccount,
  onShowDirectory,
  onRefreshClients,
  onRefreshIssues,
  view,
}: {
  accountId: string;
  clients: AppClient[];
  loading: boolean;
  error: string | null;
  onOpenAccount: (id: string) => void;
  onShowDirectory: () => void;
  onRefreshClients: () => void;
  onRefreshIssues: () => void;
  view: "directory" | "detail";
}) {
  const [tab, setTab] = useState<AccountTab>("Overview");
  const [payload, setPayload] = useState<ClientConfigPayload | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "validate" | "publish" | "export" | "sync" | null>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const client = clients.find((item) => item.id === accountId);

  useEffect(() => {
    if (view !== "detail" || !accountId) return;

    let ignore = false;
    queueMicrotask(() => {
      if (ignore) return;
      setConfigLoading(true);
      setConfigError(null);
      setMessage(null);

      getClientConfig(accountId)
        .then((nextPayload) => {
          if (ignore) return;
          setPayload(nextPayload);
          setValidation(nextPayload.validation);
          setDirty(false);
        })
        .catch((caught) => {
          if (ignore) return;
          setConfigError(caught instanceof Error ? caught.message : "Unable to load account config");
        })
        .finally(() => {
          if (!ignore) setConfigLoading(false);
        });
    });

    return () => {
      ignore = true;
    };
  }, [accountId, view]);

  const updateConfig = (path: string, value: unknown) => {
    setPayload((current) => {
      if (!current) return current;
      return { ...current, config: setConfigPath(current.config, path, value) };
    });
    setDirty(true);
    setMessage(null);
  };

  const saveDraft = async () => {
    if (!payload || !client) return false;
    setBusy("save");
    setMessage(null);
    try {
      const saved = await saveClientConfigDraft(client.id, payload.config);
      setPayload((current) => current ? { ...current, config: saved.config, readiness: saved.readiness, validation: saved.validation } : current);
      setValidation(saved.validation);
      setDirty(false);
      setMessage("Draft saved to Supabase.");
      await onRefreshClients();
      return true;
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to save draft");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const validateDraft = async () => {
    if (!client) return;
    if (dirty && !(await saveDraft())) return;
    setBusy("validate");
    setMessage(null);
    try {
      const result = await validateClientConfig(client.id);
      setValidation(result);
      setMessage(result.ok ? "Validation passed. This config can be published." : "Validation found issues to fix before publishing.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to validate config");
    } finally {
      setBusy(null);
    }
  };

  const publishDraft = async () => {
    if (!client) return;
    if (dirty && !(await saveDraft())) return;
    setBusy("publish");
    setMessage(null);
    try {
      const result = await publishClientConfig(client.id);
      setValidation(result.validation);
      if (result.ok) {
        const nextPayload = await getClientConfig(client.id);
        setPayload(nextPayload);
        setDirty(false);
        setMessage("Config published. Backend runtime will use this version.");
      } else {
        setMessage("Publish blocked. Fix the validation issues first.");
      }
      await onRefreshClients();
      await onRefreshIssues();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to publish config");
    } finally {
      setBusy(null);
    }
  };

  const syncAgent = async () => {
    if (!client || busy !== null) return;
    if (dirty && !(await saveDraft())) return;

    setBusy("sync");
    setMessage(null);
    try {
      const result = await syncElevenLabsAgent(client.id);
      const nextPayload = await getClientConfig(client.id);
      setPayload(nextPayload);
      setValidation(nextPayload.validation);
      setDirty(false);
      setMessage(`${result.message} Open the agent in the ElevenLabs dashboard to run a test call.`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to sync the ElevenLabs agent");
    } finally {
      setBusy(null);
    }
  };

  const downloadKnowledgeBase = async () => {
    if (!client || !payload || busy !== null) return;
    if (dirty && !(await saveDraft())) return;

    setBusy("export");
    setMessage(null);
    try {
      const anchor = document.createElement("a");
      anchor.href = `/api/clients/${client.id}/knowledge-base`;
      anchor.download = "";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setMessage("Knowledge base document created. Upload it to the matching ElevenLabs agent under Knowledge Base - Add document.");
    } finally {
      setBusy(null);
    }
  };

  if (view === "directory") return <AccountDirectory clients={clients} loading={loading} error={error} onOpenAccount={onOpenAccount} onRefresh={onRefreshClients} />;
  if (loading) return <LoadingState title="Loading account..." />;
  if (error) return <ErrorState title="Could not load account" error={error} onRetry={onRefreshClients} />;
  if (!client) return <ErrorState title="Account not found" error="Choose an account from the directory." onRetry={onShowDirectory} />;

  const metrics = getMetrics(client);
  const readiness = payload?.readiness ?? client.readiness;
  const configStatus = payload?.draft?.status ?? payload?.published?.status ?? client.configStatus ?? "draft";

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(199,247,111,.08),transparent_35%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#C7F76F]/[.08] text-sm font-black text-[#C7F76F] shadow-[inset_0_0_0_1px_rgba(199,247,111,.12)]">{initials(client.name)}</span>
            <div>
              <div className="mb-2.5 flex flex-wrap gap-2">
                <Badge tone={statusTone(displayStatus(client.status))}>{displayStatus(client.status)}</Badge>
                <Badge tone={metrics.errors > 0 ? "coral" : "mint"}>{metrics.errors} issues</Badge>
                <Badge tone="blue">{configStatus}</Badge>
                {dirty && <Badge tone="honey">Unsaved changes</Badge>}
              </div>
              <h1 className="font-display text-3xl font-medium tracking-[-.02em] text-white sm:text-4xl">{client.name}</h1>
              <p className="font-mono-ui mt-2 text-[11px] uppercase tracking-[.1em] text-[#94836A]">{client.industry} · {metrics.owner} · {readiness.percentage}% ready</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button kind="ghost" onClick={onShowDirectory}><Building2 size={13} /> All accounts</Button>
            <Button kind="secondary" disabled={!payload || busy !== null} onClick={saveDraft}><Database size={13} /> {busy === "save" ? "Saving..." : "Save draft"}</Button>
            <Button kind="secondary" disabled={!payload || busy !== null} onClick={downloadKnowledgeBase}><FileText size={13} /> {busy === "export" ? "Creating..." : "KB doc"}</Button>
            <Button kind="secondary" disabled={!payload || busy !== null} onClick={validateDraft}><ListChecks size={13} /> {busy === "validate" ? "Checking..." : "Validate"}</Button>
            <Button disabled={!payload || busy !== null} onClick={publishDraft}><Sparkles size={13} /> {busy === "publish" ? "Publishing..." : "Publish"}</Button>
          </div>
        </div>
      </Card>

      {message && <DemoState title="Account update" description={message} tone={message.includes("blocked") || message.includes("Unable") ? "coral" : "mint"} />}
      {configLoading && <LoadingState title="Loading config..." />}
      {configError && <ErrorState title="Could not load config" error={configError} />}

      <div className="border-b border-white/[.07]">
        <div className="flex gap-1 overflow-x-auto">
          {accountTabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={clsx(
                "relative whitespace-nowrap px-3.5 pb-3 pt-1.5 text-[12px] font-semibold tracking-[-.01em] transition-colors",
                tab === item ? "text-[#D8FF9B]" : "text-[#94836A] hover:text-[#EFE1C8]",
              )}
            >
              {item}
              {tab === item && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[#C7F76F] shadow-[0_0_10px_rgba(199,247,111,.6)]" />}
            </button>
          ))}
        </div>
      </div>

      <AccountTabContent
        tab={tab}
        client={client}
        config={payload?.config ?? null}
        readiness={readiness}
        validation={validation}
        onChange={updateConfig}
        onDownloadKnowledgeBase={downloadKnowledgeBase}
        knowledgeBaseBusy={busy === "export"}
        knowledgeBaseDisabled={!payload || busy !== null}
        knowledgeBaseNeedsSave={dirty}
        onSyncAgent={syncAgent}
        agentSyncBusy={busy === "sync"}
        agentSyncDisabled={!payload || busy !== null}
      />
    </div>
  );
}

export function IssuesPage({
  issues,
  loading,
  error,
  onOpenAccount,
  onRefresh,
}: {
  issues: ClientIssue[];
  loading: boolean;
  error: string | null;
  onOpenAccount: (id: string) => void;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState("All");
  const shown = issues.filter((issue) => filter === "All" || displayStatus(issue.severity) === filter);
  const calendarIssues = issues.filter((issue) => issue.source.toLowerCase().includes("calendar")).length;
  const configIssues = issues.filter((issue) => issue.source.toLowerCase().includes("config")).length;

  if (loading) return <LoadingState title="Loading issues..." />;
  if (error) return <ErrorState title="Could not load issues" error={error} onRetry={onRefresh} />;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard icon={TriangleAlert} label="Open issues" value={`${issues.length}`} helper="Actionable setup or live-call problems" tone={issues.length > 0 ? "coral" : "mint"} />
        <MetricCard icon={CalendarCheck} label="Calendar issues" value={`${calendarIssues}`} helper="Availability or booking failures" tone="honey" />
        <MetricCard icon={PhoneForwarded} label="Config issues" value={`${configIssues}`} helper="Validation or setup problems" tone="blue" />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">{["All", "Critical", "High", "Medium", "Low"].map((item) => <FilterPill key={item} label={item} active={filter === item} onClick={() => setFilter(item)} />)}</div>
          <Button kind="secondary" onClick={onRefresh}>Refresh issues</Button>
        </div>
        {shown.map((issue) => (
          <button key={issue.id} disabled={!issue.clientId} onClick={() => issue.clientId && onOpenAccount(issue.clientId)} className="grid w-full gap-3 border-t border-white/[.05] px-5 py-4 text-left transition hover:bg-white/[.025] disabled:cursor-not-allowed lg:grid-cols-[130px_1fr_150px_90px] lg:items-center">
            <Badge tone={statusTone(issue.severity)}>{displayStatus(issue.severity)}</Badge>
            <div><p className="text-[13px] font-bold tracking-[-.01em] text-white">{issue.title}</p><p className="mt-1 text-[11px] leading-5 text-[#94836A]">{issue.clientName ?? "Bellory"} · {issue.description ?? "No description provided."}</p></div>
            <span className="text-[12px] font-bold text-[#C7F76F]">{issue.actionLabel ?? "Review"} →</span>
            <span className="font-mono-ui text-[11px] text-[#6E5F49]">{ageFrom(issue.createdAt)}</span>
          </button>
        ))}
        {shown.length === 0 && <div className="p-5"><DemoState title="No open issues" description="Config validation and runtime issues will appear here when they need operator action." /></div>}
      </Card>
    </div>
  );
}

export function ReportsPage({
  clients,
  loading,
  error,
  onOpenAccount,
  onRefresh,
}: {
  clients: AppClient[];
  loading: boolean;
  error: string | null;
  onOpenAccount: (id: string) => void;
  onRefresh: () => void;
}) {
  const totals = clients.reduce((acc, client) => {
    acc.jobs += client.metrics?.jobsSaved ?? 0;
    acc.hours += Math.round((client.metrics?.hoursSavedMinutes ?? 0) / 60);
    acc.calls += client.metrics?.callsAnswered ?? 0;
    acc.revenue += client.metrics?.estimatedRevenueCents ?? 0;
    return acc;
  }, { jobs: 0, hours: 0, calls: 0, revenue: 0 });

  if (loading) return <LoadingState title="Loading reports..." />;
  if (error) return <ErrorState title="Could not load reports" error={error} onRetry={onRefresh} />;

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <SectionTitle title="Proof that Bellory is working" eyebrow="Client-ready reports" action={<Button kind="secondary" onClick={onRefresh}><FileChartColumn size={13} /> Refresh report</Button>} />
        <p className="max-w-3xl text-[13px] leading-6 text-[#94836A]">These numbers are wired to live daily metrics. They will move automatically once call, lead, and appointment webhooks start writing data.</p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard icon={PhoneIncoming} label="Calls answered" value={`${totals.calls}`} helper="Total account coverage" />
        <MetricCard icon={CalendarCheck} label="Jobs saved" value={`${totals.jobs}`} helper="Booked or escalated work" tone="blue" />
        <MetricCard icon={Clock3} label="Hours saved" value={`${totals.hours}`} helper="Estimated receptionist hours" tone="honey" />
        <MetricCard icon={Gauge} label="Revenue influenced" value={formatCurrency(totals.revenue)} helper="Estimated booked job value" tone="violet" />
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-white/[.06] p-5"><SectionTitle title="Account report cards" eyebrow="Share with clients" /></div>
        {clients.map((client) => {
          const metrics = getMetrics(client);
          return (
            <button key={client.id} onClick={() => onOpenAccount(client.id)} className="grid w-full gap-3 border-t border-white/[.05] px-5 py-4 text-left transition hover:bg-white/[.025] md:grid-cols-[1.2fr_.5fr_.5fr_.5fr_.7fr] md:items-center">
              <div><p className="text-[13px] font-bold tracking-[-.01em] text-white">{client.name}</p><p className="mt-1 text-[11px] text-[#94836A]">{client.industry}</p></div>
              <span className="font-mono-ui text-[13px] font-bold text-[#C7F76F]">{metrics.jobsSaved} jobs</span>
              <span className="font-mono-ui text-[13px] font-bold text-white">{metrics.hoursSaved} hrs</span>
              <span className="font-mono-ui text-[13px] font-bold text-[#F6C66A]">{metrics.revenueSaved}</span>
              <span className="text-[11px] font-bold text-[#C7F76F]">Open report →</span>
            </button>
          );
        })}
        {clients.length === 0 && <div className="p-5"><DemoState tone="honey" title="No accounts yet" description="Create a business first, then its report card will appear here." /></div>}
      </Card>
    </div>
  );
}

export function OperatorSettingsPage() {
  const [alerts, setAlerts] = useState(true);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
      <div className="space-y-4">
        <Card className="p-5">
          <SectionTitle title="Workspace" eyebrow="Internal only" action={<IconBox icon={Building2} />} />
          <div className="grid gap-3 md:grid-cols-2">
            <div><p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">Workspace name</p><Input value="Bellory HQ" disabled /></div>
            <div><p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">Timezone</p><Input value="America/Denver" disabled /></div>
            <div><p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">App URL</p><Input value="https://bellory.vercel.app" disabled /></div>
            <div><p className="font-mono-ui mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">Primary verticals</p><Input value="Home services" disabled /></div>
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="Provider connections" eyebrow="Global backend readiness" />
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Supabase", "Database connected and migrations applied", "mint"],
              ["Vercel", "Production env vars installed", "mint"],
              ["ElevenLabs", "Agent account needed next", "honey"],
              ["Twilio", "Phone number and webhooks needed next", "honey"],
              ["Google Calendar", "OAuth app needed before booking", "honey"],
              ["Stripe", "Billing can wait until the receptionist flow works", "honey"],
            ].map(([name, detail, tone]) => <DemoState key={name} title={name} description={detail} tone={tone as "mint" | "honey" | "coral"} />)}
          </div>
        </Card>
      </div>
      <Card className="p-5">
        <SectionTitle title="Operator alerts" eyebrow="Keep it simple" />
        <div className="space-y-3">
          {["Urgent call handoffs", "Calendar connection failed", "Phone route failed", "Low AI confidence"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-xl border border-white/[.06] bg-white/[.025] p-3">
              <span className="text-[12px] text-white">{item}</span>
              <Toggle enabled={alerts} onClick={() => setAlerts(!alerts)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
