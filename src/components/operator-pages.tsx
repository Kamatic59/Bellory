"use client";

import clsx from "clsx";
import { ReactNode, useMemo, useState } from "react";
import {
  ArrowRight,
  Brain,
  Building2,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Clock3,
  Database,
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
import { clients, leads } from "@/data/mock";
import { PageId } from "./app-shell";
import { Badge, Button, Card, DemoState, EmptyCheck, IconBox, Input, Progress, SectionTitle, Toggle } from "./ui";

type Client = (typeof clients)[number];
type Tone = "mint" | "honey" | "coral" | "blue" | "violet";

type AccountMetrics = {
  setupProgress: number;
  jobsSaved: number;
  hoursSaved: number;
  revenueSaved: string;
  callsAnswered: number;
  appointmentsBooked: number;
  errors: number;
  phoneMode: string;
  phoneRoute: string;
  calendar: string;
  fallback: string;
  owner: string;
  lastIssue: string;
};

const metricsByClient: Record<string, AccountMetrics> = {
  davis: { setupProgress: 100, jobsSaved: 19, hoursSaved: 42, revenueSaved: "$12.8k", callsAnswered: 86, appointmentsBooked: 19, errors: 0, phoneMode: "Existing number forwarded", phoneRoute: "(801) 555-0100 -> ElevenLabs agent", calendar: "Google Calendar connected", fallback: "Owner call, then SMS summary", owner: "Alex Davis", lastIssue: "None" },
  wasatch: { setupProgress: 72, jobsSaved: 7, hoursSaved: 18, revenueSaved: "$4.1k", callsAnswered: 38, appointmentsBooked: 8, errors: 1, phoneMode: "New Bellory number", phoneRoute: "Provisioned test number", calendar: "Owner approval mode", fallback: "Jordan Miller direct transfer", owner: "Jordan Miller", lastIssue: "Quote ranges need approval" },
  peak: { setupProgress: 91, jobsSaved: 13, hoursSaved: 31, revenueSaved: "$9.7k", callsAnswered: 64, appointmentsBooked: 15, errors: 0, phoneMode: "Existing number forwarded", phoneRoute: "(801) 555-0141 -> ElevenLabs agent", calendar: "Google Calendar connected", fallback: "Emergency transfer to owner", owner: "Nate Cole", lastIssue: "None" },
  canyon: { setupProgress: 88, jobsSaved: 11, hoursSaved: 27, revenueSaved: "$6.4k", callsAnswered: 51, appointmentsBooked: 10, errors: 3, phoneMode: "Existing number forwarded", phoneRoute: "Live route", calendar: "Calendar timeout", fallback: "Office manager, then voicemail", owner: "Ari Patel", lastIssue: "Calendar availability failing" },
  summit: { setupProgress: 100, jobsSaved: 9, hoursSaved: 23, revenueSaved: "$5.8k", callsAnswered: 44, appointmentsBooked: 9, errors: 0, phoneMode: "Existing number forwarded", phoneRoute: "(435) 555-0166 -> ElevenLabs agent", calendar: "Google Calendar connected", fallback: "Owner alert for urgent calls", owner: "Mia Brooks", lastIssue: "None" },
  clearflow: { setupProgress: 58, jobsSaved: 3, hoursSaved: 9, revenueSaved: "$1.6k", callsAnswered: 19, appointmentsBooked: 4, errors: 2, phoneMode: "Phone setup incomplete", phoneRoute: "Needs Twilio number assignment", calendar: "Connected", fallback: "Sam Reed SMS only", owner: "Sam Reed", lastIssue: "Phone route not live" },
};

const setupSteps = [
  "Business identity",
  "Locations & hours",
  "Phone routing",
  "AI voice",
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
  "AI Voice",
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
    fields: ["Legal business name", "Public greeting name", "Owner / primary contact", "Business category", "Short company description", "Brand words to use"],
    checklist: ["Primary contact saved", "Industry selected", "Caller-facing name approved", "Business timezone set"],
    backend: "organizations, clients, client_profile",
  },
  "Locations & hours": {
    title: "Set where and when the business operates.",
    description: "Service area, working hours, holidays, and after-hours behavior determine what the AI can promise.",
    fields: ["Primary address", "Service cities / ZIP codes", "Normal hours", "Emergency hours", "Holiday schedule", "Out-of-area response"],
    checklist: ["Timezone mapped to calendar", "After-hours script selected", "Service radius rules saved", "Holiday overrides ready"],
    backend: "business_locations, service_areas, business_hours",
  },
  "Phone routing": {
    title: "Decide how callers reach the receptionist.",
    description: "Choose forwarding, a new Bellory number, or porting later, then define recording and failover behavior.",
    fields: ["Current phone number", "Caller ID label", "Forward-to number", "Recording consent mode", "Missed-call fallback", "Spam handling"],
    checklist: ["Twilio number or forward target selected", "Recording rule approved", "Caller ID verified", "Route failover configured"],
    backend: "phone_numbers, call_routes, recording_settings",
  },
  "AI voice": {
    title: "Tune the human-sounding receptionist.",
    description: "Set provider, voice, pacing, interruption handling, greeting, personality, and disclosure rules.",
    fields: ["Voice provider", "Voice / agent ID", "Greeting script", "Speaking pace", "Interruption style", "Disclosure phrase"],
    checklist: ["Voice provider connected", "Greeting approved", "Natural pauses configured", "Disclosure language approved"],
    backend: "ai_agents, voice_profiles, agent_prompts",
  },
  "Receptionist brain": {
    title: "Teach Bellory how this business thinks.",
    description: "This is the source of truth for what the AI can answer, ask, avoid, and escalate.",
    fields: ["Business summary", "Common caller intents", "Required intake questions", "FAQ answers", "Words to avoid", "Competitor / warranty rules"],
    checklist: ["Prompt instructions drafted", "FAQ knowledge loaded", "Forbidden claims saved", "Low-confidence policy selected"],
    backend: "agent_instructions, knowledge_items, prompt_versions",
  },
  "Services & pricing": {
    title: "Configure services, quote ranges, and limits.",
    description: "Pricing must be structured so the AI knows when to give a range, ask more questions, or refuse exact pricing.",
    fields: ["Service catalog", "Diagnostic fees", "Starting prices", "Quote ranges", "Upsell / membership rules", "Never-quote conditions"],
    checklist: ["At least one service active", "Quote ranges approved", "Exact-price restrictions saved", "Owner approval threshold set"],
    backend: "services, pricing_rules, quote_guardrails",
  },
  "Qualification rules": {
    title: "Tell the AI what to ask before booking.",
    description: "Qualification fields make every call useful: issue, urgency, location, photos, property type, and decision maker.",
    fields: ["Required caller info", "Required issue details", "Photo/SMS request rules", "Property type questions", "Lead quality score rules", "Do-not-book conditions"],
    checklist: ["Required fields selected", "Lead scoring rules saved", "Photo request policy approved", "Spam handling configured"],
    backend: "qualification_rules, lead_fields, call_intents",
  },
  "Calendar & dispatch": {
    title: "Connect appointments to real availability.",
    description: "Booking rules decide direct booking, owner approval, travel buffers, tech assignment, and reschedules.",
    fields: ["Calendar provider", "Booking mode", "Appointment types", "Slot length", "Travel buffer", "Technician routing rules"],
    checklist: ["Calendar OAuth connected", "Booking mode selected", "Slot templates configured", "No-availability fallback set"],
    backend: "calendar_connections, appointment_rules, dispatch_rules",
  },
  "Urgency & escalation": {
    title: "Define when Bellory gets a human involved.",
    description: "The AI needs explicit urgent triggers, transfer order, low-confidence paths, and after-hours escalation rules.",
    fields: ["Urgent trigger phrases", "Primary fallback", "Secondary fallback", "Transfer hours", "SMS alert template", "Operator review threshold"],
    checklist: ["Urgent intents mapped", "Transfer numbers verified", "SMS templates approved", "Low-confidence handoff enabled"],
    backend: "fallback_contacts, escalation_rules, alert_templates",
  },
  "Compliance & policies": {
    title: "Set the rules the AI must never break.",
    description: "Recording consent, AI disclosure, data retention, privacy, safety, and forbidden advice belong here.",
    fields: ["AI disclosure policy", "Call recording consent", "Data retention window", "Safety disclaimer rules", "Prohibited advice", "Complaint handling script"],
    checklist: ["Consent language approved", "Retention policy set", "Never-say list saved", "Complaint path configured"],
    backend: "compliance_settings, policy_rules, audit_logs",
  },
  Integrations: {
    title: "Connect the tools the AI will use.",
    description: "Provider credentials and tool permissions need to be explicit before backend wiring starts.",
    fields: ["ElevenLabs agent", "Twilio account", "Google Calendar account", "CRM / job system", "SMS provider", "Billing system"],
    checklist: ["Tool permissions scoped", "Webhook endpoints planned", "Provider status visible", "Secrets ready for environment vars"],
    backend: "provider_connections, oauth_tokens, webhook_endpoints",
  },
  "Launch QA": {
    title: "Prove the receptionist is safe to launch.",
    description: "Run the same test scenarios every account needs before traffic goes live.",
    fields: ["Normal booking test", "Urgent call test", "Quote shopper test", "After-hours test", "No availability test", "Angry caller test"],
    checklist: ["All required scenarios pass", "Owner approves call summaries", "Phone route live", "Rollback plan ready"],
    backend: "test_scenarios, test_runs, launch_checks",
  },
};

const issues = [
  { id: "calendar-canyon", clientId: "canyon", severity: "High", title: "Calendar availability failing", detail: "Canyon HVAC timed out checking available appointment slots 3 times today.", owner: "Fix calendar", age: "12m" },
  { id: "quote-wasatch", clientId: "wasatch", severity: "Medium", title: "Quote rules need approval", detail: "Wasatch Door Co. has opener replacement pricing in draft mode.", owner: "Approve quotes", age: "38m" },
  { id: "phone-clearflow", clientId: "clearflow", severity: "High", title: "Phone route not live", detail: "ClearFlow still needs a Twilio number or forwarded existing number.", owner: "Set up phone", age: "1h" },
  { id: "fallback-davis", clientId: "davis", severity: "Low", title: "Fallback owner missed one transfer", detail: "Owner did not answer one urgent handoff; SMS summary was sent successfully.", owner: "Review fallback", age: "2h" },
];

const statusTone = (value: string) =>
  value === "Live" || value === "Connected" || value === "Operational" || value === "Complete" ? "mint"
    : value === "Needs Attention" || value === "Issue" || value === "High" ? "coral"
      : value === "Setup" || value === "Pilot" || value === "Approval" || value === "Testing" || value === "Medium" ? "honey"
        : "muted";

const getMetrics = (clientId: string) => metricsByClient[clientId] ?? metricsByClient.davis;
const getClient = (clientId: string) => clients.find((client) => client.id === clientId) ?? clients[0];

function MetricCard({ label, value, helper, icon, tone = "mint" }: { label: string; value: string; helper: string; icon: LucideIcon; tone?: Tone }) {
  return (
    <Card hover className="p-5">
      <div className="mb-5 flex items-start justify-between">
        <IconBox icon={icon} tone={tone} />
        <span className="rounded-full bg-white/[.04] px-2 py-1 text-[10px] font-bold text-[#94836A]">MVP</span>
      </div>
      <p className="text-3xl font-semibold tracking-[-.04em] text-white">{value}</p>
      <p className="mt-1 text-[12px] font-semibold text-[#FFF7E8]">{label}</p>
      <p className="mt-2 text-[11px] leading-5 text-[#94836A]">{helper}</p>
    </Card>
  );
}

function ConfigPanel({ title, eyebrow, icon, tone = "mint", children, action }: { title: string; eyebrow: string; icon?: LucideIcon; tone?: Tone; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-5">
      <SectionTitle title={title} eyebrow={eyebrow} action={action ?? (icon ? <IconBox icon={icon} tone={tone} /> : undefined)} />
      {children}
    </Card>
  );
}

function FieldGrid({ fields }: { fields: Array<{ label: string; value?: string; type?: string } | string> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {fields.map((field) => {
        const label = typeof field === "string" ? field : field.label;
        const value = typeof field === "string" ? undefined : field.value;
        const type = typeof field === "string" ? "text" : field.type;
        return (
          <div key={label}>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94836A]">{label}</p>
            <Input value={value} placeholder={`Enter ${label.toLowerCase()}...`} type={type} />
          </div>
        );
      })}
    </div>
  );
}

function TextAreaField({ label, value, rows = 5 }: { label: string; value: string; rows?: number }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94836A]">{label}</p>
      <textarea
        rows={rows}
        defaultValue={value}
        className="w-full rounded-2xl border border-white/[.08] bg-[#15110C]/70 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-[#94836A] focus:border-[#C7F76F]/40"
      />
    </div>
  );
}

function ChecklistGrid({ items }: { items: string[] }) {
  return <div className="grid gap-2 md:grid-cols-2">{items.map((item) => <EmptyCheck key={item} text={item} />)}</div>;
}

function ChoiceGrid({ selected, onSelect, options }: { selected: string; onSelect: (id: string) => void; options: Array<{ id: string; title: string; description: string }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {options.map((option) => (
        <button key={option.id} onClick={() => onSelect(option.id)} className={clsx("rounded-2xl border p-4 text-left transition", selected === option.id ? "border-[#C7F76F]/25 bg-[#C7F76F]/[.055]" : "border-white/[.07] bg-white/[.025] hover:bg-white/[.045]")}>
          <p className="text-[13px] font-bold text-white">{option.title}</p>
          <p className="mt-2 text-[11px] leading-5 text-[#B7AB98]">{option.description}</p>
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
        <p className="mt-2 text-[12px] leading-5 text-[#B7AB98]">Stores to <span className="font-bold text-white">{label}</span>. This is intentionally shaped like the future database/API payload.</p>
      </div>
      <div className="space-y-2">{checks.map((check) => <EmptyCheck key={check} text={check} />)}</div>
    </div>
  );
}

function AccountRow({ client, onOpen }: { client: Client; onOpen: () => void }) {
  const metrics = getMetrics(client.id);
  return (
    <button onClick={onOpen} className="grid w-full gap-3 border-t border-white/[.05] px-5 py-4 text-left transition hover:bg-white/[.025] lg:grid-cols-[1.35fr_.65fr_.75fr_.7fr_.65fr_90px] lg:items-center">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#C7F76F]/10 text-[11px] font-black text-[#C7F76F]">{client.initials}</span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-white">{client.name}</p>
          <p className="mt-1 text-[11px] text-[#B7AB98]">{client.industry} - {metrics.owner}</p>
        </div>
      </div>
      <span><Badge tone={statusTone(client.status)}>{client.status}</Badge></span>
      <div>
        <p className="text-[12px] font-semibold text-white">{metrics.setupProgress}% ready</p>
        <Progress value={metrics.setupProgress} tone={metrics.setupProgress > 90 ? "mint" : metrics.setupProgress > 70 ? "honey" : "coral"} />
      </div>
      <p className="text-[12px] text-[#C6B9A6]">{metrics.jobsSaved} jobs saved</p>
      <p className={clsx("text-[12px] font-bold", metrics.errors > 0 ? "text-[#F08B72]" : "text-[#C7F76F]")}>{metrics.errors} issues</p>
      <span className="justify-self-start text-[11px] font-bold text-[#C7F76F] lg:justify-self-end">Open -&gt;</span>
    </button>
  );
}

export function AccountsPage({ navigate, onOpenAccount }: { navigate: (id: PageId) => void; onOpenAccount: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const shown = useMemo(() => clients.filter((client) => {
    const matchesFilter = filter === "All" || client.status === filter;
    const target = `${client.name} ${client.industry} ${client.status}`.toLowerCase();
    return matchesFilter && target.includes(query.toLowerCase());
  }), [filter, query]);

  const totals = clients.reduce((acc, client) => {
    const metrics = getMetrics(client.id);
    acc.calls += metrics.callsAnswered;
    acc.jobs += metrics.jobsSaved;
    acc.hours += metrics.hoursSaved;
    acc.issues += metrics.errors;
    return acc;
  }, { calls: 0, jobs: 0, hours: 0, issues: 0 });

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(199,247,111,.095),transparent_32%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge><span className="size-1.5 rounded-full bg-[#C7F76F]" /> Business operations</Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.045em] text-white sm:text-5xl">Find a business, launch a receptionist, or fix what is broken.</h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-6 text-[#B7AB98]">This is the whole console: setup accounts, update their rules, and prove Bellory is booking work.</p>
          </div>
          <Button onClick={() => navigate("setup")} className="w-fit"><ClipboardCheck size={14} /> Set up new business</Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={PhoneIncoming} label="Calls answered" value={`${totals.calls}`} helper="Across all active accounts" />
        <MetricCard icon={CalendarCheck} label="Jobs saved" value={`${totals.jobs}`} helper="Booked or escalated instead of missed" tone="blue" />
        <MetricCard icon={Clock3} label="Hours saved" value={`${totals.hours}`} helper="Estimated receptionist time saved" tone="honey" />
        <MetricCard icon={TriangleAlert} label="Open issues" value={`${totals.issues}`} helper="Things an operator should fix" tone={totals.issues > 0 ? "coral" : "mint"} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", "Live", "Setup", "Pilot", "Needs Attention", "Paused"].map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={clsx("rounded-xl px-3 py-2 text-[11px] font-bold transition", filter === item ? "bg-[#C7F76F] text-[#17120C]" : "border border-white/[.07] bg-white/[.03] text-[#B7AB98] hover:text-white")}>{item}</button>
            ))}
          </div>
          <div className="relative w-full lg:w-[330px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94836A]" />
            <Input value={query} onChange={setQuery} placeholder="Search businesses..." className="pl-9" />
          </div>
        </div>
        <div>
          {shown.map((client) => <AccountRow key={client.id} client={client} onOpen={() => onOpenAccount(client.id)} />)}
          {shown.length === 0 && <div className="p-5"><DemoState tone="honey" title="No businesses match" description="Try a different status filter or search term." /></div>}
        </div>
      </Card>
    </div>
  );
}

function AccountDirectoryCard({ client, onOpen }: { client: Client; onOpen: () => void }) {
  const metrics = getMetrics(client.id);
  return (
    <button onClick={onOpen} className="group flex h-full flex-col rounded-[1.35rem] border border-white/[.075] bg-white/[.028] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#C7F76F]/25 hover:bg-[#C7F76F]/[.035] hover:shadow-[0_18px_50px_rgba(0,0,0,.22)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#C7F76F]/10 text-[12px] font-black text-[#C7F76F] shadow-[inset_0_0_0_1px_rgba(199,247,111,.08)]">{client.initials}</span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold tracking-tight text-white">{client.name}</p>
            <p className="mt-1 text-[11px] text-[#B7AB98]">{client.industry}</p>
          </div>
        </div>
        <Badge tone={statusTone(client.status)}>{client.status}</Badge>
      </div>
      <div className="grid gap-2 text-[11px] text-[#B7AB98]">
        <div className="flex justify-between gap-3"><span>Owner</span><span className="font-semibold text-white">{metrics.owner}</span></div>
        <div className="flex justify-between gap-3"><span>Phone</span><span className="font-semibold text-white">{client.phone}</span></div>
        <div className="flex justify-between gap-3"><span>Calendar</span><span className={clsx("font-semibold", client.calendar === "Issue" ? "text-[#F08B72]" : "text-white")}>{client.calendar}</span></div>
        <div className="flex justify-between gap-3"><span>AI</span><span className="font-semibold text-white">{client.ai}</span></div>
      </div>
      <div className="my-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94836A]">Setup readiness</span>
          <span className="text-[11px] font-black text-[#C7F76F]">{metrics.setupProgress}%</span>
        </div>
        <Progress value={metrics.setupProgress} tone={metrics.setupProgress > 90 ? "mint" : metrics.setupProgress > 70 ? "honey" : "coral"} />
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/[.06] pt-4">
        <div><p className="text-[16px] font-semibold tracking-tight text-white">{metrics.jobsSaved}</p><p className="text-[9px] uppercase tracking-wider text-[#94836A]">Jobs</p></div>
        <div><p className="text-[16px] font-semibold tracking-tight text-white">{metrics.hoursSaved}</p><p className="text-[9px] uppercase tracking-wider text-[#94836A]">Hours</p></div>
        <div><p className={clsx("text-[16px] font-semibold tracking-tight", metrics.errors > 0 ? "text-[#F08B72]" : "text-[#C7F76F]")}>{metrics.errors}</p><p className="text-[9px] uppercase tracking-wider text-[#94836A]">Issues</p></div>
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-[11px] font-black text-[#C7F76F]">Configure account <ArrowRight size={12} className="transition group-hover:translate-x-0.5" /></span>
    </button>
  );
}

function AccountDirectory({ onOpenAccount }: { onOpenAccount: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const shown = useMemo(() => clients.filter((client) => {
    const matchesFilter = filter === "All" || client.status === filter;
    const target = `${client.name} ${client.industry} ${client.status}`.toLowerCase();
    return matchesFilter && target.includes(query.toLowerCase());
  }), [filter, query]);

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(199,247,111,.09),transparent_34%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge><Building2 size={12} /> Configured accounts</Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.045em] text-white sm:text-5xl">Choose a business to configure its receptionist.</h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-6 text-[#B7AB98]">Each card opens the settings for one client: AI voice, business brain, quote rules, calendar, routing, fallbacks, compliance, integrations, and testing.</p>
          </div>
          <div className="relative w-full lg:w-[330px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94836A]" />
            <Input value={query} onChange={setQuery} placeholder="Search account cards..." className="pl-9" />
          </div>
        </div>
      </Card>
      <div className="flex flex-wrap gap-2">
        {["All", "Live", "Setup", "Pilot", "Needs Attention", "Paused"].map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={clsx("rounded-xl px-3 py-2 text-[11px] font-bold transition", filter === item ? "bg-[#C7F76F] text-[#17120C]" : "border border-white/[.07] bg-white/[.03] text-[#B7AB98] hover:text-white")}>{item}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map((client) => <AccountDirectoryCard key={client.id} client={client} onOpen={() => onOpenAccount(client.id)} />)}</div>
      {shown.length === 0 && <DemoState tone="honey" title="No configured accounts match" description="Clear the search or choose a different account status." />}
    </div>
  );
}

export function NewBusinessSetupPage({ navigate }: { navigate: (id: PageId) => void }) {
  const [step, setStep] = useState(0);
  const [phoneChoice, setPhoneChoice] = useState("forward");
  const [voiceChoice, setVoiceChoice] = useState("elevenlabs");
  const [bookingChoice, setBookingChoice] = useState("direct");
  const [fallbackChoice, setFallbackChoice] = useState("owner");
  const complete = Math.round((step / (setupSteps.length - 1)) * 100);
  const current = setupSteps[step];
  const detail = onboardingDetails[current];

  return (
    <div className="grid gap-4 xl:grid-cols-[330px_1fr]">
      <Card className="p-4">
        <div className="mb-5 rounded-2xl bg-gradient-to-br from-[#C7F76F]/10 to-transparent p-4">
          <div className="flex items-center justify-between"><Badge tone="honey">Draft setup</Badge><span className="text-sm font-bold">{complete}%</span></div>
          <p className="mt-4 text-base font-semibold text-white">New business onboarding</p>
          <p className="mt-1 text-[11px] text-[#B7AB98]">One backend-shaped path from discovery call to live receptionist.</p>
          <div className="mt-4"><Progress value={complete} /></div>
        </div>
        <div className="space-y-1">
          {setupSteps.map((item, index) => (
            <button key={item} onClick={() => setStep(index)} className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[11px] font-semibold transition", step === index ? "bg-[#C7F76F]/10 text-[#C7F76F]" : "text-[#B7AB98] hover:bg-white/[.03]")}>
              <span className={clsx("grid size-5 place-items-center rounded-full text-[8px]", index < step ? "bg-[#C7F76F] text-[#17120C]" : step === index ? "border border-[#C7F76F]/30" : "bg-white/5")}>{index < step ? <Check size={11} /> : index + 1}</span>
              {item}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-7">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#C7F76F]">Step {step + 1} of {setupSteps.length}</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white">{detail.title}</h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#B7AB98]">{detail.description}</p>
          </div>
          <IconBox icon={step === setupSteps.length - 1 ? Sparkles : ClipboardCheck} tone={step === setupSteps.length - 1 ? "honey" : "mint"} />
        </div>

        {current === "Phone routing" && (
          <div className="mb-5">
            <ChoiceGrid selected={phoneChoice} onSelect={setPhoneChoice} options={[
              { id: "forward", title: "Forward current number", description: "Fastest launch: business forwards calls to Bellory." },
              { id: "new", title: "Assign Bellory number", description: "Use a Twilio number immediately and optionally advertise it." },
              { id: "port", title: "Port later", description: "Start forwarding, then port the existing number after pilot." },
            ]} />
          </div>
        )}

        {current === "AI voice" && (
          <div className="mb-5">
            <ChoiceGrid selected={voiceChoice} onSelect={setVoiceChoice} options={[
              { id: "elevenlabs", title: "ElevenLabs agent", description: "Use the most human voice profile and live call agent config." },
              { id: "brand", title: "Custom brand voice", description: "Prepare for cloned or custom voice once approved." },
              { id: "fallback", title: "Fallback voice", description: "Choose a safe secondary voice if the primary provider fails." },
            ]} />
          </div>
        )}

        {current === "Calendar & dispatch" && (
          <div className="mb-5">
            <ChoiceGrid selected={bookingChoice} onSelect={setBookingChoice} options={[
              { id: "direct", title: "Book directly", description: "AI books when all rules match and calendar has availability." },
              { id: "approval", title: "Owner approval", description: "AI collects details and holds appointment until approved." },
              { id: "lead", title: "Lead only", description: "AI captures qualified jobs without committing a time." },
            ]} />
          </div>
        )}

        {current === "Urgency & escalation" && (
          <div className="mb-5">
            <ChoiceGrid selected={fallbackChoice} onSelect={setFallbackChoice} options={[
              { id: "owner", title: "Owner first", description: "Transfer urgent calls to owner, then SMS summary." },
              { id: "manager", title: "Manager first", description: "Use office manager for scheduling or pricing uncertainty." },
              { id: "bellory", title: "Bellory operator", description: "Route ambiguous calls to an internal Bellory operator." },
            ]} />
          </div>
        )}

        <FieldGrid fields={detail.fields} />
        <BackendMapping label={detail.backend} checks={detail.checklist} />

        <div className="mt-6 flex justify-between border-t border-white/[.06] pt-5">
          <Button kind="ghost" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>Back</Button>
          {step < setupSteps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>Save & continue <ArrowRight size={13} /></Button>
          ) : (
            <Button onClick={() => navigate("accounts")}><Sparkles size={14} /> Launch account</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function AccountTabContent({ tab, client, metrics }: { tab: AccountTab; client: Client; metrics: AccountMetrics }) {
  if (tab === "Overview") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Brain} label="Config readiness" value={`${metrics.setupProgress}%`} helper="Required receptionist settings complete" />
          <MetricCard icon={PhoneIncoming} label="Calls answered" value={`${metrics.callsAnswered}`} helper="Live calls Bellory picked up" tone="blue" />
          <MetricCard icon={CalendarCheck} label="Jobs saved" value={`${metrics.jobsSaved}`} helper="Booked or escalated work" tone="honey" />
          <MetricCard icon={TriangleAlert} label="Open issues" value={`${metrics.errors}`} helper={metrics.lastIssue} tone={metrics.errors > 0 ? "coral" : "mint"} />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <ConfigPanel title="Backend-ready configuration checklist" eyebrow="Account health" icon={ListChecks}>
            <ChecklistGrid items={["Business profile + service area", "AI voice and greeting", "Services, pricing, and quote guardrails", "Calendar booking rules", "Urgency and fallback paths", "Knowledge base and FAQs", "Compliance and never-say rules", "Launch test suite"]} />
          </ConfigPanel>
          <ConfigPanel title="Live routing summary" eyebrow={metrics.phoneMode} icon={Route} tone="blue">
            <div className="space-y-2">
              <DemoState title="Phone" description={metrics.phoneRoute} />
              <DemoState title="Calendar" description={metrics.calendar} tone={client.calendar === "Issue" ? "coral" : "mint"} />
              <DemoState title="Fallback" description={metrics.fallback} tone="honey" />
            </div>
          </ConfigPanel>
        </div>
      </div>
    );
  }

  if (tab === "Business Brain") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Business facts" eyebrow="Core memory" icon={Building2}>
          <FieldGrid fields={[
            { label: "Caller-facing name", value: client.name },
            { label: "Industry", value: client.industry },
            { label: "Primary owner", value: metrics.owner },
            { label: "Timezone", value: "America/Denver" },
            { label: "Service area", value: "Salt Lake City metro + nearby suburbs" },
            { label: "Brand tone", value: "Warm, capable, concise, local" },
          ]} />
          <div className="mt-3">
            <TextAreaField label="Business summary used by the AI" value={`${client.name} helps local homeowners with ${client.industry.toLowerCase()} needs. Bellory should answer as a calm receptionist, gather the problem, service location, urgency, caller details, and booking intent before using tools.`} />
          </div>
        </ConfigPanel>
        <ConfigPanel title="Caller intake fields" eyebrow="Lead schema" icon={UsersRound} tone="honey">
          <ChecklistGrid items={["Caller name", "Callback phone", "Service address", "Problem description", "Urgency", "Preferred appointment window", "Photos requested when useful", "Decision maker confirmed"]} />
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "AI Voice") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Voice and personality" eyebrow="ElevenLabs agent profile" icon={Headphones}>
          <FieldGrid fields={[
            { label: "Voice provider", value: "ElevenLabs Conversational AI" },
            { label: "Voice / agent ID", value: `${client.id}-bellory-agent` },
            { label: "Speaking pace", value: "Variable, human-natural" },
            { label: "Interruption behavior", value: "Allow short caller interruptions" },
            { label: "Background noise", value: "Subtle office ambience" },
            { label: "Disclosure phrase", value: "I am Bellory, the receptionist for this business." },
          ]} />
          <div className="mt-3">
            <TextAreaField label="Greeting script" value={`Thanks for calling ${client.name}. This is Bellory at the front desk. How can I help today?`} rows={3} />
          </div>
          <div className="mt-3">
            <TextAreaField label="Agent behavior instructions" value="Sound human, brief, and helpful. Use natural pauses. Acknowledge the caller before asking the next question. Never invent pricing, appointment availability, warranties, or safety advice. Use tools before confirming booking details." />
          </div>
        </ConfigPanel>
        <ConfigPanel title="Human-likeness controls" eyebrow="Voice QA" icon={SlidersHorizontal} tone="violet">
          <ChecklistGrid items={["Variable speech speed", "Natural filler words allowed", "Breath/pause behavior enabled", "No robotic long monologues", "Can be interrupted", "Keeps answers under 20 seconds", "Repeats critical details", "Escalates when unsure"]} />
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Call Flow") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Conversation stages" eyebrow="Runtime flow" icon={MessageSquareText}>
          <div className="grid gap-3 md:grid-cols-2">
            {["Answer with approved greeting", "Classify caller intent", "Collect required intake fields", "Check service area", "Determine urgency", "Use calendar/pricing tools", "Confirm next step", "Send owner/client summary"].map((item, index) => (
              <div key={item} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
                <p className="text-[10px] font-black text-[#C7F76F]">0{index + 1}</p>
                <p className="mt-2 text-[13px] font-bold text-white">{item}</p>
              </div>
            ))}
          </div>
        </ConfigPanel>
        <ConfigPanel title="Call handling settings" eyebrow="Phone behavior" icon={PhoneForwarded} tone="blue">
          <FieldGrid fields={[
            { label: "Max ring before answer", value: "1.8 seconds" },
            { label: "Max call duration before review", value: "12 minutes" },
            { label: "Spam handling", value: "Politely end and mark spam" },
            { label: "Failed tool fallback", value: "Collect callback + alert owner" },
          ]} />
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Services & Pricing") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <ConfigPanel title="Service catalog" eyebrow={client.industry} icon={Wrench}>
            <ChecklistGrid items={["Diagnostics", "Repair", "Replacement", "Maintenance", "Emergency service", "Membership / tune-up plan"]} />
          </ConfigPanel>
          <ConfigPanel title="Quote guardrails" eyebrow="Pricing safety" icon={ShieldCheck} tone="honey">
            <ChecklistGrid items={["Use ranges only", "Mention diagnostic fee", "Ask qualifying questions first", "Owner approval above threshold", "Never guarantee exact price", "Never quote unsupported work"]} />
          </ConfigPanel>
          <ConfigPanel title="Qualification before price" eyebrow="Required context" icon={ListChecks} tone="blue">
            <ChecklistGrid items={["Problem type", "Brand/model if known", "Property type", "Urgency", "Photos if useful", "Service address"]} />
          </ConfigPanel>
        </div>
        <ConfigPanel title="Editable pricing rules" eyebrow="Backend pricing_rules" icon={Database} tone="violet">
          <FieldGrid fields={[
            { label: "Diagnostic fee", value: "$89" },
            { label: "Standard repair range", value: "$180-$650" },
            { label: "Emergency surcharge", value: "$125 after hours" },
            { label: "Exact quote threshold", value: "Never exact without owner approval" },
          ]} />
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Calendar & Dispatch") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Booking rules" eyebrow={metrics.calendar} icon={CalendarCheck}>
          <FieldGrid fields={[
            { label: "Calendar provider", value: "Google Calendar" },
            { label: "Booking mode", value: client.calendar === "Approval" ? "Owner approval before booking" : "Book directly when rules match" },
            { label: "Slot length", value: "30 minutes" },
            { label: "Travel buffer", value: "20 minutes" },
            { label: "Appointment window wording", value: "Arrival window, not exact arrival time" },
            { label: "No availability behavior", value: "Collect preferred windows + alert owner" },
          ]} />
        </ConfigPanel>
        <ConfigPanel title="Dispatch intelligence" eyebrow="Job assignment" icon={MapPinned} tone="honey">
          <ChecklistGrid items={["Service area matched", "Nearest tech preferred", "Emergency slots protected", "Owner approval for high-value jobs", "Reschedule rules set", "Cancellation policy read when needed"]} />
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Urgency & Fallbacks") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Urgency triggers" eyebrow="Escalation rules" icon={TriangleAlert} tone="coral">
          <ChecklistGrid items={["Safety risk", "Active leak / property damage", "Door stuck open", "Caller trapped or business-critical issue", "Caller angry or asking for owner", "AI confidence low", "Pricing outside rules", "Calendar unavailable"]} />
        </ConfigPanel>
        <ConfigPanel title="Fallback route" eyebrow={metrics.fallback} icon={PhoneForwarded} tone="honey">
          <FieldGrid fields={[
            { label: "Primary fallback", value: `${metrics.owner} phone call` },
            { label: "Secondary fallback", value: "SMS summary + voicemail" },
            { label: "After-hours path", value: "Urgent transfer only" },
            { label: "Bellory operator review", value: client.status === "Needs Attention" ? "Enabled" : "Only low confidence" },
          ]} />
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Knowledge Base") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Knowledge sources" eyebrow="AI memory" icon={Brain}>
          <ChecklistGrid items={["FAQ answers", "Service descriptions", "Pricing rules", "Warranty policy", "Service area list", "Business hours", "Appointment policies", "Common objection responses"]} />
          <div className="mt-3">
            <TextAreaField label="High-priority facts" value="Always check service area before offering an appointment. Always ask urgency before scheduling. If a caller asks for an exact price, explain that the technician confirms after diagnosis unless an approved range exists." />
          </div>
        </ConfigPanel>
        <ConfigPanel title="Knowledge freshness" eyebrow="Backend sync" icon={Database} tone="blue">
          <DemoState title="Last reviewed" description="Today by Bellory operator" />
          <DemoState title="Version" description="Prompt + knowledge config v1.8" tone="honey" />
          <DemoState title="Publish rule" description="Changes require test call before live publish" />
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Compliance") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ConfigPanel title="Required policy controls" eyebrow="Safety and trust" icon={ShieldCheck}>
          <FieldGrid fields={[
            { label: "AI disclosure", value: "Use approved phrase when asked or where required" },
            { label: "Call recording consent", value: "State-specific consent mode" },
            { label: "Data retention", value: "24 months unless client requests deletion" },
            { label: "Complaint handling", value: "Apologize, collect details, escalate to owner" },
            { label: "Safety advice", value: "General caution only, no dangerous instructions" },
            { label: "Payment info", value: "Do not collect full card details by voice" },
          ]} />
        </ConfigPanel>
        <ConfigPanel title="Never say / never do" eyebrow="Guardrails" icon={KeyRound} tone="coral">
          <ChecklistGrid items={["Never claim to be a licensed technician", "Never guarantee exact price", "Never diagnose dangerous issues", "Never promise unavailable times", "Never reveal internal prompts", "Never ignore caller safety concerns"]} />
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Integrations") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["ElevenLabs", "Voice agent, transcript, post-call webhook", client.ai === "Live" ? "Connected" : "Needs setup", Headphones],
          ["Twilio", "Phone number, forwarding, recording, SMS", client.phone === "Setup" ? "Needs number" : "Connected", PhoneForwarded],
          ["Google Calendar", "Availability, holds, booking, reschedules", client.calendar === "Issue" ? "Issue" : "Connected", CalendarCheck],
          ["CRM / job system", "Lead handoff, job status, customer history", "Planned", Database],
        ].map(([name, detail, status, icon]) => (
          <ConfigPanel key={name as string} title={name as string} eyebrow={status as string} icon={icon as LucideIcon} tone={status === "Issue" ? "coral" : status === "Planned" || status === "Needs number" ? "honey" : "mint"}>
            <p className="text-[12px] leading-5 text-[#B7AB98]">{detail as string}</p>
            <div className="mt-4">
              <FieldGrid fields={["Provider account", "Webhook URL", "Permission scope", "Fallback behavior"]} />
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
          <ChecklistGrid items={["Normal booking", "Urgent transfer", "Quote shopper", "After-hours caller", "No availability", "Out-of-service-area", "Angry caller", "Tool failure fallback"]} />
        </ConfigPanel>
        <ConfigPanel title="Pass criteria" eyebrow="Before publish" icon={ListChecks} tone="honey">
          <ChecklistGrid items={["Collected all required fields", "Used correct pricing guardrail", "Did not invent availability", "Escalated correctly", "Summary sent", "No forbidden claims"]} />
        </ConfigPanel>
      </div>
    );
  }

  if (tab === "Calls & Jobs") {
    const related = leads.filter((lead) => lead.business === client.name);
    return (
      <Card className="overflow-hidden">
        <div className="border-b border-white/[.06] p-5"><SectionTitle title="Recent calls and jobs" eyebrow="Account history" /></div>
        {(related.length > 0 ? related : leads.slice(0, 3)).map((lead) => (
          <div key={lead.id} className="grid gap-3 border-t border-white/[.05] px-5 py-4 md:grid-cols-[1fr_150px_120px_90px] md:items-center">
            <div><p className="text-[13px] font-bold text-white">{lead.name} - {lead.issue}</p><p className="mt-1 text-[11px] text-[#B7AB98]">{lead.summary}</p></div>
            <Badge tone={statusTone(lead.urgency)}>{lead.urgency}</Badge>
            <span className="text-[12px] font-bold text-[#C7F76F]">{lead.value}</span>
            <span className="text-[11px] text-[#94836A]">{lead.age} ago</span>
          </div>
        ))}
      </Card>
    );
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
  navigate,
  onOpenAccount,
  onShowDirectory,
  view,
}: {
  accountId: string;
  navigate: (id: PageId) => void;
  onOpenAccount: (id: string) => void;
  onShowDirectory: () => void;
  view: "directory" | "detail";
}) {
  const [tab, setTab] = useState<AccountTab>("Overview");
  const client = getClient(accountId);
  const metrics = getMetrics(client.id);

  if (view === "directory") return <AccountDirectory onOpenAccount={onOpenAccount} />;

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(199,247,111,.08),transparent_35%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-14 place-items-center rounded-3xl bg-[#C7F76F]/10 text-sm font-black text-[#C7F76F]">{client.initials}</span>
            <div>
              <div className="mb-2 flex flex-wrap gap-2"><Badge tone={statusTone(client.status)}>{client.status}</Badge><Badge tone={metrics.errors > 0 ? "coral" : "mint"}>{metrics.errors} issues</Badge><Badge tone="blue">Backend-shaped config</Badge></div>
              <h1 className="text-3xl font-semibold tracking-[-.04em] text-white">{client.name}</h1>
              <p className="mt-2 text-[13px] text-[#B7AB98]">{client.industry} - {metrics.owner} - {metrics.phoneMode}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button kind="ghost" onClick={onShowDirectory}><Building2 size={13} /> All accounts</Button>
            <Button kind="secondary" onClick={() => navigate("issues")}><TriangleAlert size={13} /> View issues</Button>
            <Button onClick={() => navigate("reports")}><FileChartColumn size={13} /> View report</Button>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {accountTabs.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={clsx("whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-bold", tab === item ? "bg-[#C7F76F] text-[#17120C]" : "border border-white/[.07] bg-white/[.03] text-[#B7AB98]")}>{item}</button>
        ))}
      </div>

      <AccountTabContent tab={tab} client={client} metrics={metrics} />
    </div>
  );
}

export function IssuesPage({ onOpenAccount }: { onOpenAccount: (id: string) => void }) {
  const [filter, setFilter] = useState("All");
  const shown = issues.filter((issue) => filter === "All" || issue.severity === filter);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard icon={TriangleAlert} label="Open issues" value={`${issues.length}`} helper="Actionable setup or live-call problems" tone="coral" />
        <MetricCard icon={CalendarCheck} label="Calendar issues" value="1" helper="Availability or booking failures" tone="honey" />
        <MetricCard icon={PhoneForwarded} label="Phone issues" value="1" helper="Routes that are not ready" tone="blue" />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">{["All", "High", "Medium", "Low"].map((item) => <button key={item} onClick={() => setFilter(item)} className={clsx("rounded-xl px-3 py-2 text-[11px] font-bold", filter === item ? "bg-[#C7F76F] text-[#17120C]" : "border border-white/[.07] bg-white/[.03] text-[#B7AB98]")}>{item}</button>)}</div>
          <p className="text-[12px] text-[#B7AB98]">Only issues that need action live here. Raw logs stay out of the MVP.</p>
        </div>
        {shown.map((issue) => {
          const client = getClient(issue.clientId);
          return (
            <button key={issue.id} onClick={() => onOpenAccount(issue.clientId)} className="grid w-full gap-3 border-t border-white/[.05] px-5 py-4 text-left transition hover:bg-white/[.025] lg:grid-cols-[130px_1fr_150px_90px] lg:items-center">
              <Badge tone={statusTone(issue.severity)}>{issue.severity}</Badge>
              <div><p className="text-[13px] font-bold text-white">{issue.title}</p><p className="mt-1 text-[11px] leading-5 text-[#B7AB98]">{client.name} - {issue.detail}</p></div>
              <span className="text-[12px] font-bold text-[#C7F76F]">{issue.owner}</span>
              <span className="text-[11px] text-[#94836A]">{issue.age}</span>
            </button>
          );
        })}
      </Card>
    </div>
  );
}

export function ReportsPage({ onOpenAccount }: { onOpenAccount: (id: string) => void }) {
  const totals = clients.reduce((acc, client) => {
    const metrics = getMetrics(client.id);
    acc.jobs += metrics.jobsSaved;
    acc.hours += metrics.hoursSaved;
    acc.calls += metrics.callsAnswered;
    return acc;
  }, { jobs: 0, hours: 0, calls: 0 });

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <SectionTitle title="Proof that Bellory is working" eyebrow="Client-ready reports" action={<Button kind="secondary"><FileChartColumn size={13} /> Export report</Button>} />
        <p className="max-w-3xl text-[13px] leading-6 text-[#B7AB98]">Keep this page focused on outcomes a business owner understands: calls answered, jobs saved, revenue influenced, and time back.</p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard icon={PhoneIncoming} label="Calls answered" value={`${totals.calls}`} helper="Total account coverage" />
        <MetricCard icon={CalendarCheck} label="Jobs saved" value={`${totals.jobs}`} helper="Booked or escalated work" tone="blue" />
        <MetricCard icon={Clock3} label="Hours saved" value={`${totals.hours}`} helper="Estimated receptionist hours" tone="honey" />
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-white/[.06] p-5"><SectionTitle title="Account report cards" eyebrow="Share with clients" /></div>
        {clients.map((client) => {
          const metrics = getMetrics(client.id);
          return (
            <button key={client.id} onClick={() => onOpenAccount(client.id)} className="grid w-full gap-3 border-t border-white/[.05] px-5 py-4 text-left transition hover:bg-white/[.025] md:grid-cols-[1.2fr_.5fr_.5fr_.5fr_.7fr] md:items-center">
              <div><p className="text-[13px] font-bold text-white">{client.name}</p><p className="mt-1 text-[11px] text-[#B7AB98]">{client.industry}</p></div>
              <span className="text-[13px] font-bold text-[#C7F76F]">{metrics.jobsSaved} jobs</span>
              <span className="text-[13px] font-bold text-white">{metrics.hoursSaved} hrs</span>
              <span className="text-[13px] font-bold text-[#F6C66A]">{metrics.revenueSaved}</span>
              <span className="text-[11px] font-bold text-[#C7F76F]">Open report -&gt;</span>
            </button>
          );
        })}
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
          <FieldGrid fields={[
            { label: "Workspace name", value: "Bellory HQ" },
            { label: "Timezone", value: "America/Denver" },
            { label: "App domain", value: "app.bellory.ai" },
            { label: "Primary verticals", value: "Garage doors + home services" },
          ]} />
        </Card>
        <Card className="p-5">
          <SectionTitle title="Provider connections" eyebrow="Global backend readiness" />
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Supabase", "Database pending credentials", "honey"],
              ["ElevenLabs", "Agent account needed", "honey"],
              ["Twilio", "Phone number needed", "honey"],
              ["Google Calendar", "OAuth app needed", "honey"],
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
