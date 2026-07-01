"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CalendarCheck,
  Check,
  ClipboardCheck,
  FileText,
  Headphones,
  LockKeyhole,
  MessageSquareText,
  PhoneCall,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Badge, Button, Card, IconBox, Input, SectionTitle, Select } from "./ui";

type WaitlistForm = {
  name: string;
  email: string;
  company: string;
  phone: string;
  businessType: string;
  callVolume: string;
  goal: string;
  calendarProvider: string;
  message: string;
  website: string;
};

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (command: "event", eventName: string, params?: AnalyticsProperties) => void;
  plausible?: (eventName: string, options?: { props?: AnalyticsProperties }) => void;
};

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const defaultForm: WaitlistForm = {
  name: "",
  email: "",
  company: "",
  phone: "",
  businessType: "Plumbing / HVAC",
  callVolume: "3-10 missed calls/week",
  goal: "Book appointments and transfer urgent calls",
  calendarProvider: "Google Calendar",
  message: "",
  website: "",
};

const callJourney = [
  {
    icon: Headphones,
    tone: "mint",
    step: "01",
    title: "Sounds human",
    text: "Natural pacing, small pauses, warm confirmations, and room for interruptions.",
  },
  {
    icon: MessageSquareText,
    tone: "blue",
    step: "02",
    title: "Qualifies the call",
    text: "It checks urgency, service area, pricing rules, customer details, and calendar logic.",
  },
  {
    icon: CalendarCheck,
    tone: "honey",
    step: "03",
    title: "Books or transfers",
    text: "It holds the appointment, sends a summary, or gets a real person when needed.",
  },
] as const;

const storySections = [
  {
    id: "proof",
    eyebrow: "Problem",
    title: "Missed calls quietly drain revenue.",
    text: "A caller who reaches voicemail usually keeps dialing. Bellory makes sure the business answers first, even after hours, during lunch, or when the team is already on another job.",
    metric: "$7k+",
    metricLabel: "20 missed calls x $350 average job = $7,000 in lost monthly revenue",
    icon: BadgeDollarSign,
    tone: "honey",
  },
  {
    id: "human-sound",
    eyebrow: "Human sound",
    title: "It should not feel like a robot reading a script.",
    text: "Bellory is designed to pause, clarify, handle interruptions, and escalate instead of forcing callers through a rigid phone tree.",
    metric: "24/7",
    metricLabel: "human-like coverage without hiring overnight staff",
    icon: Headphones,
    tone: "mint",
  },
  {
    id: "setup",
    eyebrow: "Configuration",
    title: "Bellory learns how your business actually handles calls.",
    text: "Services, prices, service areas, emergency rules, calendar availability, FAQs, and who to call when something needs a human are configured before launch.",
    metric: "1 setup",
    metricLabel: "custom receptionist per business, not a generic chatbot",
    icon: ShieldCheck,
    tone: "blue",
  },
] as const;

const howSteps = [
  {
    icon: ClipboardCheck,
    tone: "honey",
    title: "We configure your business",
    text: "Services, hours, service area, pricing rules, calendar, fallback contacts, and call handling preferences.",
  },
  {
    icon: PhoneCall,
    tone: "mint",
    title: "Bellory answers calls",
    text: "It qualifies the caller, checks urgency, follows your rules, and keeps the conversation moving.",
  },
  {
    icon: CalendarCheck,
    tone: "blue",
    title: "You get bookings and summaries",
    text: "Appointments go to your calendar and your team gets clean notes, urgent flags, and next actions.",
  },
] as const;

const demoTranscript = [
  {
    speaker: "Caller",
    text: "My water heater is leaking and I need someone today.",
  },
  {
    speaker: "Bellory",
    text: "I can help. Is water actively pooling right now, or is it contained?",
  },
  {
    speaker: "Bellory checks",
    text: "Urgency, service area, availability, pricing rules, and calendar openings.",
  },
  {
    speaker: "Outcome",
    text: "Booked for today, 2-4 PM. Owner receives SMS summary with issue details.",
  },
] as const;

const beforeAfterRows = [
  ["Missed call goes to voicemail", "Call answered instantly"],
  ["Caller calls a competitor", "Caller gets qualified"],
  ["Owner finds out later", "Job is booked or escalated"],
  ["No clean call notes", "Summary sent to the team"],
] as const;

const serviceTypes = ["Plumbing", "HVAC", "Garage doors", "Electrical", "Roofing", "Restoration", "Landscaping", "Local service teams"];
const businessTypes = ["Plumbing / HVAC", "Garage door", "Electrical", "Roofing", "Restoration", "Landscaping", "Other service business"];
const callVolumes = ["1-2 missed calls/week", "3-10 missed calls/week", "10-25 missed calls/week", "25+ missed calls/week"];
const goals = ["Book appointments and transfer urgent calls", "Book appointments only", "Qualify leads only", "Transfer urgent calls only"];
const calendars = ["Google Calendar", "Outlook Calendar", "ServiceTitan / field software", "Manual scheduling", "Not sure yet"];

const trustItems = [
  { icon: ShieldCheck, title: "Human fallback routing", text: "Urgent or uncertain calls can transfer to the right person." },
  { icon: LockKeyhole, title: "Private setup", text: "Every account is configured for that business instead of using a generic script." },
  { icon: FileText, title: "Call summaries", text: "Owners receive notes with caller details, urgency, outcome, and next action." },
  { icon: AlertTriangle, title: "Consent-aware settings", text: "Recording and consent behavior can be configured by state and business rules." },
] as const;

const faqs = [
  {
    question: "Will callers know it is AI?",
    answer: "Bellory is designed to sound calm and natural, with pauses, clarification, and short questions. If a caller needs a person, Bellory can transfer the call.",
  },
  {
    question: "Can Bellory transfer urgent calls to me?",
    answer: "Yes. Urgent triggers, fallback contacts, and escalation rules are configured during setup so emergency calls do not get trapped in automation.",
  },
  {
    question: "Does it work after hours?",
    answer: "Yes. After-hours coverage is one of the core use cases. Bellory can qualify callers, hold appointments, or route urgent issues.",
  },
  {
    question: "Can it book directly to my calendar?",
    answer: "That is the goal for supported calendars. During setup we configure availability, booking rules, appointment types, and fallback behavior.",
  },
  {
    question: "What happens if Bellory does not know the answer?",
    answer: "It can ask a clarifying question, take a message, or route the call to a human instead of inventing an answer.",
  },
  {
    question: "What businesses is this for?",
    answer: "Bellory is currently focused on home service and local service businesses where missed calls often mean missed revenue.",
  },
  {
    question: "Can I customize what it says?",
    answer: "Yes. Services, FAQs, pricing language, emergency rules, service areas, calendar rules, and tone are configured per business.",
  },
  {
    question: "When will early access open?",
    answer: "We are onboarding in small batches so every setup can be tested before it answers real customer calls.",
  },
] as const;

function trackLandingEvent(name: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;

  track(name, properties);

  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer?.push({ event: name, ...properties });
  analyticsWindow.gtag?.("event", name, properties);
  analyticsWindow.plausible?.(name, { props: properties });
  window.dispatchEvent(new CustomEvent("bellory:analytics", { detail: { name, properties } }));
}

function GlowPill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[#C7F76F]/20 bg-[#C7F76F]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.16em] text-[#D8FF9B]">{children}</span>;
}

function SectionIntro({ eyebrow, title, text, center = false }: { eyebrow: string; title: string; text: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <Badge><Sparkles size={12} /> {eyebrow}</Badge>
      <h2 className="mt-5 text-4xl font-semibold leading-[.96] tracking-[-.06em] text-white sm:text-6xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-[#D8CCB8] sm:text-lg">{text}</p>
    </div>
  );
}

function Waveform({ active = true }: { active?: boolean }) {
  const bars = useMemo(() => [28, 48, 34, 72, 42, 88, 53, 35, 66, 46, 80, 31, 58, 39, 71, 45], []);

  return (
    <div className="flex h-16 items-center gap-1.5 rounded-2xl border border-[#C7F76F]/10 bg-[#C7F76F]/[.035] px-4">
      {bars.map((height, index) => (
        <motion.span
          key={`${height}-${index}`}
          className="w-2 rounded-full bg-gradient-to-t from-[#94C759] to-[#D8FF9B]"
          animate={active ? { height: [`${height * 0.55}%`, `${height}%`, `${height * 0.7}%`] } : { height: `${height * 0.52}%` }}
          transition={{ duration: 1.3 + index * 0.03, repeat: active ? Infinity : 0, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function HumanCallCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.65, ease: "easeOut" }}
      className="relative mx-auto mt-7 w-full max-w-5xl"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-[#C7F76F]/[.07] blur-3xl" />
      <Card className="relative overflow-hidden p-3 sm:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(199,247,111,.11),transparent_30%),radial-gradient(circle_at_82%_100%,rgba(246,198,106,.07),transparent_32%)]" />
        <div className="relative grid gap-4 lg:grid-cols-[.86fr_1.14fr] lg:items-stretch">
          <div className="rounded-[1.4rem] border border-white/[.07] bg-[#15110C]/70 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#C7F76F]/10">
                  <Image src="/brand/bellory-bell.png" alt="" width={38} height={38} className="drop-shadow-[0_10px_24px_rgba(199,247,111,.18)]" />
                </span>
                <div>
                  <p className="text-[13px] font-black text-white">Incoming after-hours call</p>
                  <p className="text-[11px] text-[#BCA98B]">Handled in a calm, human voice</p>
                </div>
              </div>
              <GlowPill>Live</GlowPill>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/[.07] bg-white/[.035] p-3.5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-[#BCA98B]">Caller</p>
                <p className="text-[16px] font-semibold leading-6 tracking-[-.03em] text-white">&quot;My water heater is leaking. Can anyone come today?&quot;</p>
              </div>
              <div className="rounded-2xl border border-[#C7F76F]/12 bg-[#C7F76F]/[.04] p-3.5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-[#C7F76F]">Bellory</p>
                <p className="text-[13px] leading-6 text-[#FFF7E8]">&quot;I can help. I just need two quick details, then I will find the soonest opening or get the owner if this needs immediate attention.&quot;</p>
              </div>
              <Waveform />
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/[.07] bg-white/[.025] p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#C7F76F]">What happens next</p>
            <div className="mt-4 space-y-3">
              {callJourney.map((item) => (
                <div key={item.title} className="grid gap-3 rounded-2xl border border-white/[.06] bg-[#15110C]/58 p-3 sm:grid-cols-[auto_1fr]">
                  <div className="flex items-center gap-3 sm:block">
                    <IconBox icon={item.icon} tone={item.tone} />
                    <p className="text-[11px] font-black tracking-[.18em] text-white/[.22] sm:mt-3">{item.step}</p>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-[-.035em] text-white">{item.title}</h3>
                    <p className="mt-1 text-[11px] leading-5 text-[#D8CCB8]">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function WhoForSection() {
  return (
    <section id="who-for" className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8">
      <Card className="overflow-hidden p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[.72fr_1fr] lg:items-center">
          <div>
            <Badge><Building2 size={12} /> Built for service businesses</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.055em] text-white sm:text-5xl">For teams that lose jobs when the phone is missed.</h2>
            <p className="mt-4 text-[15px] leading-8 text-[#D8CCB8]">
              Bellory is focused on home service and local service businesses where a missed call can turn into a missed appointment, estimate, or emergency job.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {serviceTypes.map((item) => (
              <div key={item} className="rounded-2xl border border-white/[.07] bg-[#15110C]/60 p-3 text-[13px] font-bold text-[#FFF7E8]">
                <Check size={14} className="mb-3 text-[#C7F76F]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionIntro
        eyebrow="How it works"
        title="Set it up once. Let it handle the phone."
        text="Bellory is not a generic chatbot. It is configured around how your business actually takes calls, books work, and decides what needs a human."
        center
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {howSteps.map((step, index) => (
          <Card key={step.title} className="p-5">
            <div className="mb-8 flex items-center justify-between">
              <IconBox icon={step.icon} tone={step.tone} />
              <span className="text-[42px] font-black tracking-[-.08em] text-white/[.05]">0{index + 1}</span>
            </div>
            <h3 className="text-xl font-semibold tracking-[-.04em] text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#D8CCB8]">{step.text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function StoryPanel({ section, index }: { section: (typeof storySections)[number]; index: number }) {
  return (
    <motion.article
      id={section.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="scroll-mt-24"
    >
      <Card className="relative overflow-hidden p-5 sm:p-7 lg:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(199,247,111,.08),transparent_34%)]" />
        <div className="relative grid gap-5 md:grid-cols-[1fr_15rem] lg:grid-cols-[1fr_20rem] lg:items-center">
          <div>
            <GlowPill>{section.eyebrow}</GlowPill>
            <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-[1] tracking-[-.055em] text-white sm:text-5xl lg:text-[3.45rem]">
              {section.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D8CCB8] sm:text-base sm:leading-8">{section.text}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/[.07] bg-[#15110C]/70 p-5 md:min-h-56">
            <div className="flex items-center justify-between">
              <IconBox icon={section.icon} tone={section.tone} />
              <span className="text-[44px] font-black tracking-[-.08em] text-white/[.05]">0{index + 1}</span>
            </div>
            <p className="mt-8 text-4xl font-semibold tracking-[-.065em] text-white sm:text-5xl">{section.metric}</p>
            <p className="mt-3 text-[11px] font-black uppercase leading-5 tracking-[.16em] text-[#BCA98B]">{section.metricLabel}</p>
          </div>
        </div>
      </Card>
    </motion.article>
  );
}

function DemoSection() {
  const [playing, setPlaying] = useState(false);

  const playDemo = () => {
    trackLandingEvent("demo_play_click", { location: "demo_section" });
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), 22000);
  };

  return (
    <section id="demo" className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionIntro
        eyebrow="Call demo"
        title="See what Bellory does during and after a real service call."
        text="The page needs proof, so this section shows the actual decision path: caller context, urgency, service area, availability, owner fallback, and the summary your team receives."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="overflow-hidden p-5 sm:p-7">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#C7F76F]">22-second walkthrough</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-.045em] text-white">Water heater emergency call</h3>
            </div>
            <Button onClick={playDemo} kind={playing ? "secondary" : "primary"}>
              <Play size={14} /> {playing ? "Playing walkthrough..." : "Play call demo"}
            </Button>
          </div>
          <Waveform active={playing} />
          <div className="mt-5 space-y-3">
            {demoTranscript.map((line, index) => (
              <div
                key={line.speaker}
                className={`rounded-2xl border p-4 transition ${playing && index !== 0 ? "border-[#C7F76F]/24 bg-[#C7F76F]/[.045]" : "border-white/[.07] bg-[#15110C]/60"}`}
              >
                <p className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-[#C7F76F]">{line.speaker}</p>
                <p className="text-sm leading-7 text-[#FFF7E8]">{line.text}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-5">
          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#C7F76F]">Owner receives</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-.045em] text-white">New booked job</h3>
              </div>
              <IconBox icon={CalendarCheck} tone="mint" />
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Customer", "Sarah M."],
                ["Issue", "Water heater leaking"],
                ["Urgency", "High - water pooling near utility closet"],
                ["Booked", "Today, 2-4 PM"],
                ["Action", "Added to calendar + SMS summary sent"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                  <span className="min-w-20 text-[11px] font-black uppercase tracking-[.14em] text-[#BCA98B]">{label}</span>
                  <span className="font-semibold text-[#FFF7E8]">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[.18em] text-[#C7F76F]">Before / after</p>
            <div className="grid gap-2">
              {beforeAfterRows.map(([withoutBellory, withBellory]) => (
                <div key={withoutBellory} className="grid gap-2 rounded-2xl border border-white/[.06] bg-white/[.025] p-3 sm:grid-cols-2">
                  <p className="text-[12px] leading-5 text-[#BCA98B]">{withoutBellory}</p>
                  <p className="text-[12px] font-bold leading-5 text-[#D8FF9B]">{withBellory}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section id="trust" className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <SectionIntro
          eyebrow="Trust guardrails"
          title="Built for the calls you cannot afford to mishandle."
          text="Bellory touches customers, scheduling, and urgent details. The setup is intentionally private, rule-based, and backed by human fallback paths."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {trustItems.map((item) => (
            <Card key={item.title} className="p-5">
              <IconBox icon={item.icon} tone="mint" />
              <h3 className="mt-5 text-lg font-semibold tracking-[-.04em] text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#D8CCB8]">{item.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionIntro
        eyebrow="FAQ"
        title="Questions business owners ask before handing calls to AI."
        text="The short version: Bellory is configured before launch, answers from your rules, and escalates when a human should take over."
        center
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {faqs.map((faq) => (
          <Card key={faq.question} className="p-5">
            <h3 className="text-lg font-semibold tracking-[-.035em] text-white">{faq.question}</h3>
            <p className="mt-3 text-sm leading-7 text-[#D8CCB8]">{faq.answer}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FieldLabel({ children, optional = false }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wider text-[#BCA98B]">
      <span>{children}</span>
      {optional && <span className="text-[10px] tracking-[.12em] text-[#BCA98B]/75">Optional</span>}
    </p>
  );
}

function WaitlistCard({
  id,
  source = "landing",
  onSuccess,
}: {
  id?: string;
  source?: string;
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  const update = (key: keyof WaitlistForm) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (!formStarted) {
      setFormStarted(true);
      trackLandingEvent("waitlist_form_start", { source });
    }
    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setStatus("error");
      setMessage("Add your name, email, and phone number so we can qualify your setup.");
      return;
    }

    setStatus("saving");
    setMessage("");
    trackLandingEvent("waitlist_form_submit", { source, businessType: form.businessType, callVolume: form.callVolume });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok === false) throw new Error(data?.error || "Could not join waitlist");
      setStatus("success");
      setMessage("You're in. We will review your fit and reach out with the next available setup window.");
      trackLandingEvent("waitlist_form_complete", { source, businessType: form.businessType, callVolume: form.callVolume });
      setForm(defaultForm);
      setShowDetails(false);
      setFormStarted(false);
      onSuccess?.();
    } catch (error) {
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Try again.";
      setMessage(errorMessage);
      trackLandingEvent("waitlist_form_error", { source, error: errorMessage });
    }
  };

  return (
    <div id={id} className={id ? "scroll-mt-24" : undefined}>
      <Card className="relative overflow-hidden p-5 sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(199,247,111,.11),transparent_34%)]" />
        <form onSubmit={submit} className="relative">
          <SectionTitle title="Request early access" eyebrow="Private waitlist" action={<IconBox icon={Sparkles} tone="honey" />} />
          <p className="mb-5 text-[13px] leading-6 text-[#D8CCB8]">
            We are onboarding a small number of service businesses at a time so every Bellory setup is tested before it answers real calls.
          </p>

          <div className="rounded-2xl border border-[#C7F76F]/12 bg-[#C7F76F]/[.035] p-3 text-[12px] leading-5 text-[#D8FF9B]">
            Early access requests are reviewed manually. No spam, no public launch blast.
          </div>

          <input
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            name="website"
            value={form.website}
            onChange={(event) => update("website")(event.target.value)}
            className="hidden"
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div>
              <FieldLabel>Name</FieldLabel>
              <Input value={form.name} onChange={update("name")} placeholder="Your name" ariaLabel="Name" name="name" autoComplete="name" required />
            </div>
            <div>
              <FieldLabel>Work email</FieldLabel>
              <Input value={form.email} onChange={update("email")} placeholder="you@company.com" type="email" ariaLabel="Work email" name="email" autoComplete="email" required />
            </div>
            <div>
              <FieldLabel>Phone number</FieldLabel>
              <Input value={form.phone} onChange={update("phone")} placeholder="Best number" type="tel" ariaLabel="Phone number" name="phone" autoComplete="tel" required />
            </div>
            <div>
              <FieldLabel optional>Business name</FieldLabel>
              <Input value={form.company} onChange={update("company")} placeholder="Business name" ariaLabel="Business name" name="company" autoComplete="organization" />
            </div>
            <div>
              <FieldLabel>Business type</FieldLabel>
              <Select value={form.businessType} onChange={update("businessType")} ariaLabel="Business type" name="businessType">
                {businessTypes.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Missed calls</FieldLabel>
              <Select value={form.callVolume} onChange={update("callVolume")} ariaLabel="Approximate missed calls per week" name="callVolume">
                {callVolumes.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </div>
          </div>

          <button
            type="button"
            aria-expanded={showDetails}
            onClick={() => {
              setShowDetails((current) => {
                const next = !current;
                if (next) trackLandingEvent("waitlist_optional_details_opened", { source });
                return next;
              });
            }}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/[.08] bg-white/[.035] px-4 py-3 text-[13px] font-bold text-[#FFF7E8] transition hover:bg-white/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/35"
          >
            {showDetails ? "Hide optional setup details" : "Add optional setup details"}
          </button>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <FieldLabel optional>What should Bellory do?</FieldLabel>
                  <Select value={form.goal} onChange={update("goal")} ariaLabel="Bellory goal" name="goal">
                    {goals.map((item) => <option key={item}>{item}</option>)}
                  </Select>
                </div>
                <div>
                  <FieldLabel optional>Calendar</FieldLabel>
                  <Select value={form.calendarProvider} onChange={update("calendarProvider")} ariaLabel="Calendar provider" name="calendarProvider">
                    {calendars.map((item) => <option key={item}>{item}</option>)}
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <FieldLabel optional>Setup details</FieldLabel>
                  <textarea
                    value={form.message}
                    onChange={(event) => update("message")(event.target.value)}
                    rows={4}
                    name="message"
                    aria-label="Setup details"
                    placeholder="Example: We miss after-hours emergencies, need calls booked into Google Calendar, and want urgent water leaks transferred to the owner."
                    className="w-full rounded-2xl border border-white/[.08] bg-[#15110C]/70 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-[#BCA98B] focus:border-[#C7F76F]/40 focus-visible:ring-2 focus-visible:ring-[#C7F76F]/20"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <Button disabled={status === "saving"} type="submit" className="mt-5 w-full py-3">
            {status === "saving" ? "Requesting..." : "Request my invite"} <ArrowRight size={14} />
          </Button>
          <p className="mt-3 text-center text-[11px] leading-5 text-[#BCA98B]">We will only use this to contact you about Bellory setup and early access.</p>
          {message && <p aria-live="polite" className={status === "error" ? "mt-3 text-center text-[12px] text-[#F08B72]" : "mt-3 text-center text-[12px] text-[#C7F76F]"}>{message}</p>}
        </form>
      </Card>
    </div>
  );
}

function LeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-[#12100C]/82 p-4 backdrop-blur-xl" onMouseDown={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-3xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Request early access"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 grid size-10 place-items-center rounded-full border border-white/10 bg-[#15110C] text-[#FFF7E8] shadow-xl transition hover:bg-white/[.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/35"
          aria-label="Close early access form"
        >
          <X size={18} />
        </button>
        <WaitlistCard source="landing_modal" />
      </motion.div>
    </div>
  );
}

function StickyMobileCTA({ onRequest, onDemo }: { onRequest: () => void; onDemo: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[.08] bg-[#12100C]/90 p-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2">
        <Button onClick={onRequest} className="py-3">Request early access</Button>
        <Button kind="secondary" onClick={onDemo} className="px-3 py-3" ariaLabel="Hear demo">
          <Headphones size={16} />
        </Button>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  const scrollToSection = (id: string, eventName: string) => {
    trackLandingEvent(eventName, { target: id });
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openLeadModal = (location: string) => {
    trackLandingEvent("request_access_click", { location });
    setLeadModalOpen(true);
  };

  return (
    <main className="landing-page min-h-screen overflow-hidden text-[#FFF7E8]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-18rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[#C7F76F]/10 blur-3xl" />
        <div className="absolute bottom-[-18rem] right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[#F6C66A]/10 blur-3xl" />
        <div className="grid-glow absolute inset-x-0 top-0 h-[36rem] opacity-40" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3" onClick={() => trackLandingEvent("nav_logo_click")}>
          <Image src="/brand/bellory-bell.png" alt="Bellory" width={46} height={46} className="drop-shadow-[0_12px_28px_rgba(199,247,111,.18)]" priority />
          <div>
            <p className="text-[20px] font-black tracking-[-.045em] text-white">Bellory<span className="text-[#C7F76F]">.</span></p>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#BCA98B]">AI receptionist</p>
          </div>
        </a>
        <nav className="hidden items-center gap-6 text-[12px] font-bold text-[#D8CCB8] md:flex">
          <a href="#how-it-works" className="hover:text-white">How it works</a>
          <a href="#demo" className="hover:text-white">Demo</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <Button onClick={() => openLeadModal("header")}>Request access</Button>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-86px)] max-w-[1180px] flex-col justify-center px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mx-auto max-w-5xl text-center">
          <Badge><span className="pulse-ring size-1.5 rounded-full bg-[#C7F76F]" /> Human-sounding AI receptionist</Badge>
          <h1 className="text-balance mx-auto mt-4 max-w-5xl text-5xl font-semibold leading-[.9] tracking-[-.075em] text-white sm:text-7xl lg:text-[5.7rem]">
            Turn missed calls into booked jobs.
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#D8CCB8]">
            Bellory answers missed and after-hours calls, qualifies the customer, books from your real availability, and transfers urgent calls to a human when needed.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => openLeadModal("hero")} className="px-5 py-3 text-sm">Request early access <ArrowRight size={15} /></Button>
            <Button kind="secondary" onClick={() => scrollToSection("demo", "hear_demo_click")} className="px-5 py-3 text-sm">Hear Bellory answer a call</Button>
          </div>
        </motion.div>

        <HumanCallCard />
      </section>

      <WhoForSection />
      <HowItWorksSection />

      <section className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-5 sm:gap-6">
          {storySections.map((section, index) => <StoryPanel key={section.id} section={section} index={index} />)}
        </div>
      </section>

      <DemoSection />
      <TrustSection />
      <FAQSection />

      <section className="relative z-10 mx-auto grid max-w-[1180px] gap-8 px-4 pb-20 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[.82fr_1.18fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <div className="self-start"><Badge><Star size={12} /> Private launch</Badge></div>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-.055em] text-white sm:text-6xl">Want Bellory to answer your phones?</h2>
          <p className="mt-5 max-w-xl text-[15px] leading-8 text-[#D8CCB8]">We are opening installs in small batches so every business gets configured correctly: voice, phone, pricing, calendar, fallbacks, and launch QA.</p>
          <div className="mt-8 grid gap-3">
            {["Human-sounding receptionist", "Calendar-aware booking", "Custom business rules", "Human fallback routing"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[13px] font-bold text-[#FFF7E8]"><Check size={15} className="text-[#C7F76F]" /> {item}</div>
            ))}
          </div>
        </div>
        <WaitlistCard id="waitlist" source="landing_bottom" />
      </section>

      <footer className="relative z-10 border-t border-white/[.06] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 text-[12px] text-[#BCA98B] md:flex-row md:items-center md:justify-between">
          <p>Bellory AI - custom AI receptionists for service businesses that cannot afford to miss the phone.</p>
          <div className="flex flex-wrap gap-4">
            <a href="/privacy" className="font-bold text-[#FFF7E8]">Privacy</a>
            <a href="/terms" className="font-bold text-[#FFF7E8]">Terms</a>
            <a href="/contact" className="font-bold text-[#FFF7E8]">Contact</a>
            <a href="#waitlist" className="font-bold text-[#C7F76F]">Request access</a>
          </div>
        </div>
      </footer>

      <StickyMobileCTA onRequest={() => openLeadModal("sticky_mobile")} onDemo={() => scrollToSection("demo", "sticky_demo_click")} />
      <LeadModal open={leadModalOpen} onClose={() => setLeadModalOpen(false)} />
    </main>
  );
}
