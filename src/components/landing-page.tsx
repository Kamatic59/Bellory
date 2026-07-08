"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Headphones,
  LockKeyhole,
  Minus,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { Button, Input, Select } from "./ui";

type WaitlistForm = {
  name: string;
  email: string;
  company: string;
  phone: string;
  serviceArea: string;
  callVolume: string;
  runsAds: string;
  bookingSystem: string;
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
  serviceArea: "",
  callVolume: "3-10 missed calls/week",
  runsAds: "Yes - Google Ads or LSAs",
  bookingSystem: "Google Calendar",
  message: "",
  website: "",
};

const callVolumes = ["1-2 missed calls/week", "3-10 missed calls/week", "10-25 missed calls/week", "25+ missed calls/week"];
const adOptions = ["Yes - Google Ads or LSAs", "Yes - both ads and SEO", "No paid ads right now", "Not sure"];
const bookingSystems = ["Google Calendar", "Outlook Calendar", "ServiceTitan / field software", "Jobber / Housecall Pro", "Manual scheduling", "Not sure yet"];

const demoPhoneDisplay = "(385) 340-1808";
const demoPhoneHref = "tel:+13853401808";

const heroTranscript = [
  { at: "9:47:02 PM", speaker: "caller" as const, text: "My garage door spring snapped and my car is stuck inside. Can someone come tonight?" },
  { at: "9:47:09 PM", speaker: "bellory" as const, text: "I can help with that. Is the door stuck fully closed, or has it come off the track too?" },
  { at: "9:47:15 PM", speaker: "caller" as const, text: "It looks closed. Just won’t budge." },
  { at: "9:47:21 PM", speaker: "bellory" as const, text: "Got it — and since your car is trapped, I’ll treat this as urgent. Let me check the soonest opening." },
];

const tickerLines = [
  { time: "6:12 AM", issue: "Opener not responding", result: "Booked · 9:00 AM window" },
  { time: "12:31 PM", issue: "Lunch-hour overflow call", result: "Qualified · summary sent" },
  { time: "5:48 PM", issue: "New door estimate", result: "Booked · Thursday" },
  { time: "8:03 PM", issue: "Door stuck open", result: "Transferred to owner" },
  { time: "9:47 PM", issue: "Broken spring, car trapped", result: "Booked · 7:30 AM" },
  { time: "11:20 PM", issue: "Off-track door", result: "Booked · next morning" },
  { time: "2:06 AM", issue: "Remote not pairing", result: "Details taken · owner notified" },
  { time: "7:15 AM", issue: "Spring replacement quote", result: "Qualified · range given" },
];

const howSteps = [
  {
    num: "01",
    title: "We configure it for you",
    text: "Services, hours, service area, emergency rules, booking logic, fallback contacts, and summary preferences — set up with you, not by you.",
  },
  {
    num: "02",
    title: "Bellory answers the phone",
    text: "It qualifies broken springs, stuck doors, opener issues, trapped vehicles, and after-hours emergencies in a calm, human voice.",
  },
  {
    num: "03",
    title: "You get the result",
    text: "A booked job, a transferred call, or a clean summary — based on your rules. No extra app for your team to live inside.",
  },
];

const demoTranscript = [
  { at: "0:01", speaker: "Bellory", text: "Thanks for calling Wasatch Garage Door, this is Sam. How can I help?" },
  { at: "0:06", speaker: "Caller", text: "My garage door spring broke and the door won’t open. My car is stuck inside." },
  { at: "0:13", speaker: "Bellory", text: "Oh no — okay, let’s get you taken care of. Is the door stuck fully closed, or is it off track too?" },
  { at: "0:19", speaker: "Caller", text: "It looks closed. I don’t think it’s off track." },
  { at: "0:24", speaker: "Bellory", text: "Got it. Since your car’s trapped I’ll treat this as urgent — one sec, let me check the soonest opening for you." },
];

const demoTryItems = [
  "Tell it a spring snapped and your car is trapped",
  "Ask what a new opener install runs",
  "Ask if they cover your neighborhood",
  "Book a real appointment — it goes on a live calendar",
  "Try to trip it up. Interrupt it. Mumble.",
];

const summaryRows = [
  ["Issue", "Broken spring"],
  ["Urgency", "High — vehicle trapped"],
  ["Service", "Same-day repair"],
  ["Action", "Booked per owner rules"],
  ["Summary", "Sent to the team"],
] as const;

const beforeAfterRows = [
  ["Call rings out to voicemail", "Call answered in seconds"],
  ["Caller dials your competitor", "Caller gets qualified"],
  ["Owner finds out tomorrow", "Job booked or escalated now"],
  ["No notes, no context", "Clean summary sent to the team"],
] as const;

const whoRows = [
  ["Owner-operators", "You’re on jobs, driving, quoting, or handling installs — and can’t always answer."],
  ["Small teams", "Your office person gets busy, takes lunch, leaves at five, or misses overflow."],
  ["Growing companies", "You’re paying for Google leads and ads. Every unanswered ring is paid traffic wasted."],
  ["After-hours repair", "Stuck-open doors, broken springs, and trapped vehicles don’t wait for morning."],
] as const;

const trustItems = [
  { icon: ShieldCheck, title: "Emergency routing", text: "Trapped vehicles, stuck-open doors, and after-hours issues route to the right person — a real one." },
  { icon: LockKeyhole, title: "Private install", text: "Every Bellory setup is built around one garage door company’s call flow. Nothing generic, nothing shared." },
  { icon: FileText, title: "Clean summaries", text: "Your team gets issue, urgency, service area, outcome, and next action after every call." },
  { icon: AlertTriangle, title: "Rules before automation", text: "Bellory follows approved booking, transfer, consent, and fallback rules instead of guessing." },
] as const;

const faqs = [
  { question: "Can I hear it before I request anything?", answer: "Yes — call the live demo line at (385) 340-1808 any time, day or night. It answers as Wasatch Garage Door, a demo company running Bellory end to end. Ask it about pricing, coverage, or book a test appointment." },
  { question: "How does the free month work?", answer: "We install Bellory free and you run it on your line for a full month. If it doesn't book you jobs you would have missed, you pay nothing and we take it off your line — no hard feelings. If it earns its keep, we'll talk simple monthly pricing. No contract either way." },
  { question: "Do I have to manage another app?", answer: "No. Bellory is a done-for-you setup. We configure, test, and support the system with you." },
  { question: "Is Bellory only for garage door companies?", answer: "For the first private installs, yes. We are starting with garage door companies so the call flows, emergency rules, and booking logic are built for this niche before expanding." },
  { question: "Can Bellory handle urgent calls?", answer: "Yes. Bellory can identify situations like stuck-open doors, broken springs, trapped vehicles, off-track doors, and after-hours emergencies, then book or transfer based on your rules." },
  { question: "Can it transfer calls to a real person?", answer: "Yes. You decide when Bellory should transfer and who it should contact." },
  { question: "Can it book jobs?", answer: "Yes, if your calendar or booking process supports it. If not, Bellory can qualify the customer and send a clean summary to your team." },
  { question: "Will it replace my office person?", answer: "No. Bellory is best for missed calls, overflow, lunch breaks, after-hours calls, and busy periods." },
  { question: "What happens if Bellory does not know the answer?", answer: "It follows your approved rules and escalates to a human instead of guessing." },
  { question: "How much work is setup?", answer: "You answer questions about your business. We handle the technical setup, call flow, testing, and support." },
] as const;

const setupChecklist = ["Services", "Service areas", "Business hours", "Emergency routing", "Booking rules", "Fallback contacts", "Call summaries", "Test scenarios"];

function trackLandingEvent(name: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;

  track(name, properties);

  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer?.push({ event: name, ...properties });
  analyticsWindow.gtag?.("event", name, properties);
  analyticsWindow.plausible?.(name, { props: properties });
  window.dispatchEvent(new CustomEvent("bellory:analytics", { detail: { name, properties } }));
}

/* ---------------------------------- atoms --------------------------------- */

function MonoTag({ children, tone = "mint" }: { children: ReactNode; tone?: "mint" | "cream" | "honey" }) {
  const tones = {
    mint: "text-[#A9D96B]",
    cream: "text-[#94836A]",
    honey: "text-[#E8B65C]",
  };
  return <p className={`font-mono-ui text-[11px] font-semibold uppercase tracking-[.22em] ${tones[tone]}`}>{children}</p>;
}

function SectionMark({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="font-mono-ui text-[11px] font-semibold tracking-[.2em] text-[#94C759]">({index})</span>
      <div className="rule-dashed w-16 opacity-50" />
      <MonoTag>{label}</MonoTag>
    </div>
  );
}

function DisplayHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-display text-balance text-4xl font-medium leading-[1.02] tracking-[-.02em] text-[#FFF7E8] sm:text-5xl lg:text-6xl ${className}`}>
      {children}
    </h2>
  );
}

function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative z-10 mx-auto max-w-[1180px] scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24 ${className}`}>
      {children}
    </section>
  );
}

function Waveform({ active = true, bars = 22 }: { active?: boolean; bars?: number }) {
  const prefersReducedMotion = useReducedMotion();
  const animated = active && !prefersReducedMotion;
  const heights = useMemo(
    () => Array.from({ length: bars }, (_, i) => 24 + Math.abs(Math.sin(i * 1.7)) * 62),
    [bars],
  );

  return (
    <div className="flex h-12 items-center gap-[5px]" aria-hidden="true">
      {heights.map((height, index) => (
        <motion.span
          key={index}
          className="w-[3px] rounded-full bg-gradient-to-t from-[#7FA84E] to-[#D8FF9B]"
          animate={animated ? { height: [`${height * 0.4}%`, `${height}%`, `${height * 0.6}%`] } : { height: `${height * 0.52}%` }}
          transition={{ duration: 1.1 + (index % 5) * 0.09, repeat: animated ? Infinity : 0, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ------------------------------- hero ticket ------------------------------ */

function CallTicket() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, rotate: 0.6 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.21, 0.6, 0.35, 1] }}
      className="relative w-full max-w-[460px]"
    >
      <div className="absolute -inset-8 rounded-[3rem] bg-[#C7F76F]/[.06] blur-3xl" aria-hidden="true" />

      <div className="glass relative overflow-hidden rounded-[22px]">
        {/* ticket header */}
        <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="relative grid size-9 place-items-center rounded-xl bg-[#C7F76F]/10 shadow-[inset_0_0_0_1px_rgba(199,247,111,.16)]">
              <PhoneIncoming size={15} className="text-[#C7F76F]" />
              <span className="pulse-ring absolute -right-1 -top-1 size-2 rounded-full bg-[#C7F76F]" />
            </span>
            <div>
              <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.18em] text-[#94836A]">Incoming · after hours</p>
              <p className="text-[13px] font-bold text-white">Canyon Garage Doors</p>
            </div>
          </div>
          <p className="font-mono-ui text-[11px] text-[#94836A]">9:47 PM</p>
        </div>

        {/* transcript */}
        <div className="space-y-3.5 px-5 py-5">
          {heroTranscript.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + index * 0.22, duration: 0.3 }}
              className="grid grid-cols-[64px_1fr] gap-3"
            >
              <p className="font-mono-ui pt-0.5 text-[10px] leading-4 text-[#94836A]">{line.at.replace(" PM", "")}</p>
              <div>
                <p className={`font-mono-ui mb-1 text-[10px] font-semibold uppercase tracking-[.2em] ${line.speaker === "bellory" ? "text-[#A9D96B]" : "text-[#94836A]"}`}>
                  {line.speaker === "bellory" ? "Bellory" : "Caller"}
                </p>
                <p className={`text-[13px] leading-[1.55] ${line.speaker === "bellory" ? "text-[#F4EAD5]" : "text-[#C6B9A6]"}`}>{line.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* perforation + outcome */}
        <div className="px-5"><div className="rule-dashed opacity-60" /></div>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Waveform bars={14} />
          </div>
          <motion.span
            initial={{ opacity: 0, scale: 1.4, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ delay: 1.4, duration: 0.3, ease: "backOut" }}
            className="stamp text-[#C7F76F]"
          >
            <Check size={11} strokeWidth={3} /> Booked · 7:30 AM
          </motion.span>
        </div>
      </div>

      <p className="font-mono-ui mt-3 text-center text-[10px] tracking-[.08em] text-[#94836A]">Illustrative call — every install is configured to its own rules</p>
      <div className="font-mono-ui mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#94836A]">
        <span className="flex items-center gap-2"><Check size={12} className="text-[#94C759]" /> Answers in seconds</span>
        <span className="flex items-center gap-2"><Check size={12} className="text-[#94C759]" /> Books straight to your calendar</span>
      </div>
    </motion.div>
  );
}

/* ------------------------------ ticker strip ------------------------------ */

function CallLogTicker() {
  const doubled = [...tickerLines, ...tickerLines];
  return (
    <div className="relative z-10 border-y border-white/[.06] bg-[#13100B]/60 py-3.5">
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="ticker items-center gap-10 pr-10">
          {doubled.map((line, index) => (
            <span key={index} className="font-mono-ui flex shrink-0 items-center gap-3 text-[11px] tracking-[.02em]">
              <span className="text-[#94836A]">{line.time}</span>
              <span className="text-[#C6B9A6]">{line.issue}</span>
              <span className="text-[#94C759]">→ {line.result}</span>
              <span className="ml-4 size-1 rounded-full bg-[#4A3F2E]" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
      <p className="font-mono-ui mt-2 px-5 text-center text-[10px] uppercase tracking-[.24em] text-[#94836A]">Illustrative call log</p>
    </div>
  );
}

/* ------------------------------ demo section ------------------------------ */

function DemoSection() {
  const requestInstall = () => {
    trackLandingEvent("demo_section_cta_click", { target: "waitlist" });
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Section id="demo">
      <div>
        <SectionMark index="03" label="Try it yourself" />
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <DisplayHeading>Don’t take our word for it.<br className="hidden sm:block" /> Call it right now.</DisplayHeading>
          <p className="max-w-sm text-base leading-7 text-[#B7AB98]">This number rings a live Bellory receptionist running a real demo company. No form, no signup — just call.</p>
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
        {/* live demo line + sample transcript */}
        <div>
          <div className="glass overflow-hidden rounded-[22px]">
            <div className="border-b border-white/[.07] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-[#C7F76F]/10 shadow-[inset_0_0_0_1px_rgba(199,247,111,.18)]">
                    <PhoneCall size={20} className="text-[#C7F76F]" />
                    <span className="pulse-ring absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#C7F76F]" />
                  </span>
                  <div>
                    <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.2em] text-[#A9D96B]">Live demo line · answers 24/7</p>
                    <a
                      href={demoPhoneHref}
                      onClick={() => trackLandingEvent("demo_call_click", { location: "demo_section" })}
                      className="font-display mt-1 block text-3xl font-medium tracking-[-.02em] text-white transition hover:text-[#D8FF9B] sm:text-4xl"
                    >
                      {demoPhoneDisplay}
                    </a>
                  </div>
                </div>
                <div className="hidden sm:block"><Waveform bars={16} /></div>
              </div>
              <p className="font-mono-ui mt-4 text-[10px] leading-4 tracking-[.04em] text-[#94836A]">
                Answers as Wasatch Garage Door — a demo company running Bellory end to end. Demo calls wrap up after about two minutes; real installs have no cap.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <p className="font-mono-ui mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#94836A]">Things to try on the call</p>
              <div className="flex flex-wrap gap-2.5">
                {demoTryItems.map((item) => (
                  <span key={item} className="font-mono-ui rounded-full border border-white/[.1] bg-white/[.03] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.1em] text-[#C6B9A6]">
                    {item}
                  </span>
                ))}
              </div>

              <div className="rule-dashed mt-6 opacity-50" />
              <p className="font-mono-ui mt-5 mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#94836A]">How a call usually starts</p>
              <div className="space-y-4">
                {demoTranscript.map((line, index) => (
                  <div key={index} className="grid grid-cols-[44px_1fr] gap-3.5">
                    <p className="font-mono-ui pt-0.5 text-[10px] text-[#94836A]">{line.at}</p>
                    <div className="rounded-xl border border-white/[.06] bg-white/[.015] p-3.5">
                      <p className={`font-mono-ui mb-1.5 text-[10px] font-semibold uppercase tracking-[.2em] ${line.speaker === "Bellory" ? "text-[#A9D96B]" : "text-[#94836A]"}`}>{line.speaker}</p>
                      <p className="text-[13px] leading-6 text-[#EFE1C8]">{line.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="font-mono-ui mt-4 text-[10px] leading-4 tracking-[.04em] text-[#94836A]">
                Sample exchange — your install gets its own voice, greeting, services, and rules.
              </p>
            </div>
          </div>
        </div>

        {/* receipt + before/after */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="glass relative overflow-hidden rounded-[22px] p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.2em] text-[#94836A]">What your team receives</p>
                  <p className="mt-1.5 text-lg font-bold tracking-[-.02em] text-white">Call summary</p>
                </div>
                <span className="stamp text-[#C7F76F]"><Check size={11} strokeWidth={3} /> Handled</span>
              </div>
              <div className="rule-dashed mb-4 opacity-50" />
              <div className="space-y-0">
                {summaryRows.map(([label, value], index) => (
                  <div key={label} className={`flex items-baseline justify-between gap-4 py-2.5 ${index > 0 ? "border-t border-white/[.05]" : ""}`}>
                    <span className="font-mono-ui shrink-0 text-[10px] font-semibold uppercase tracking-[.16em] text-[#94836A]">{label}</span>
                    <span className="text-right text-[13px] font-semibold text-[#F4EAD5]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="rule-dashed mt-4 opacity-50" />
              <p aria-hidden="true" className="font-mono-ui mt-4 text-center text-[10px] uppercase tracking-[.3em] text-[#94836A]">· · · Bellory · · ·</p>
            </div>
          </div>

          <div>
            <div className="glass rounded-[22px] p-5 sm:p-6">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <p className="font-mono-ui flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#94836A]"><PhoneMissed size={12} /> Without Bellory</p>
                <p className="font-mono-ui flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#A9D96B]"><PhoneCall size={12} /> With Bellory</p>
              </div>
              <div className="space-y-2">
                {beforeAfterRows.map(([before, after]) => (
                  <div key={before} className="grid grid-cols-2 gap-3 rounded-xl border border-white/[.05] bg-white/[.015] p-3">
                    <p className="flex items-start gap-2 text-[13px] leading-5 text-[#94836A]"><Minus size={12} className="mt-1 shrink-0 opacity-60" /> {before}</p>
                    <p className="flex items-start gap-2 text-[13px] font-semibold leading-5 text-[#D8FF9B]"><Check size={12} className="mt-1 shrink-0" /> {after}</p>
                  </div>
                ))}
              </div>
              <Button onClick={requestInstall} className="mt-5 w-full">
                Start my free month <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------- FAQ section ------------------------------ */

function FAQItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-t border-white/[.07]">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-6 rounded-lg py-5 text-left transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/40">
        <span className="text-[15px] font-semibold tracking-[-.01em] text-[#FFF7E8] sm:text-base">{question}</span>
        <span className={`grid size-7 shrink-0 place-items-center rounded-full border border-white/[.12] text-[#94836A] transition-transform duration-200 ${open ? "rotate-180 border-[#C7F76F]/30 text-[#C7F76F]" : ""}`}>
          <ChevronDown size={14} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 text-base leading-7 text-[#B7AB98]">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <div className="lg:sticky lg:top-24">
            <SectionMark index="07" label="Questions" />
            <DisplayHeading>Asked before handing calls to AI.</DisplayHeading>
            <p className="mt-5 max-w-sm text-base leading-7 text-[#B7AB98]">
              The short version: Bellory is configured before launch, answers from your rules, and escalates when a human should take over.
            </p>
          </div>
        </div>
        <div>
          <div className="border-b border-white/[.07]">
            {faqs.map((faq, index) => (
              <FAQItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                open={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------ waitlist form ------------------------------ */

function FieldLabel({ children, optional = false }: { children: ReactNode; optional?: boolean }) {
  return (
    <p className="font-mono-ui mb-2 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">
      <span>{children}</span>
      {optional && <span className="text-[10px] tracking-[.12em] text-[#94836A]">Optional</span>}
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
      trackLandingEvent("form_started", { source });
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
      const validationMessage = "Add your name, email, and phone number so we can set up your free month.";
      setMessage(validationMessage);
      trackLandingEvent("form_error", { source, error: "missing_required_fields" });
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, businessType: "Garage door company", source }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok === false) throw new Error(data?.error || "Could not join waitlist");
      setStatus("success");
      setMessage("Got it. We'll reach out to schedule your 15-minute fit call and get your free month set up.");
      trackLandingEvent("form_submitted", { source, callVolume: form.callVolume, runsAds: form.runsAds, bookingSystem: form.bookingSystem });
      setForm(defaultForm);
      setShowDetails(false);
      setFormStarted(false);
      onSuccess?.();
    } catch (error) {
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Try again.";
      setMessage(errorMessage);
      trackLandingEvent("form_error", { source, error: errorMessage });
    }
  };

  return (
    <div id={id} className={id ? "scroll-mt-24" : undefined}>
      <div className="glass relative overflow-hidden rounded-[22px] p-5 sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(199,247,111,.07),transparent_36%)]" aria-hidden="true" />
        <form onSubmit={submit} className="relative">
          <MonoTag>First month free</MonoTag>
          <h3 className="font-display mt-3 text-2xl font-medium tracking-[-.015em] text-white sm:text-3xl">Start your free month.</h3>
          <p className="mt-3 text-[13px] leading-6 text-[#B7AB98]">
            We install Bellory free and you run it for a full month. If it doesn’t book you jobs you’d have missed, you pay nothing. Leave your details and we’ll set up a 15-minute fit call.
          </p>

          <input
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            name="website"
            value={form.website}
            onChange={(event) => update("website")(event.target.value)}
            className="hidden"
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Name</FieldLabel>
              <Input value={form.name} onChange={update("name")} placeholder="Your name" ariaLabel="Name" name="name" autoComplete="name" required />
            </div>
            <div>
              <FieldLabel>Phone number</FieldLabel>
              <Input value={form.phone} onChange={update("phone")} placeholder="Best number" type="tel" ariaLabel="Phone number" name="phone" autoComplete="tel" required />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Work email</FieldLabel>
              <Input value={form.email} onChange={update("email")} placeholder="you@company.com" type="email" ariaLabel="Work email" name="email" autoComplete="email" required />
            </div>
          </div>

          <button
            type="button"
            aria-expanded={showDetails}
            onClick={() => {
              setShowDetails((current) => {
                const next = !current;
                if (next) trackLandingEvent("optional_setup_details_opened", { source });
                return next;
              });
            }}
            className="font-mono-ui mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[.14] px-4 py-3 text-[11px] font-semibold uppercase tracking-[.12em] text-[#B7AB98] transition hover:border-white/[.24] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/35"
          >
            {showDetails ? "Hide optional details" : "+ Add optional details — business, area, calendar"}
          </button>

          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel optional>Business name</FieldLabel>
                    <Input value={form.company} onChange={update("company")} placeholder="Company name" ariaLabel="Business name" name="company" autoComplete="organization" />
                  </div>
                  <div>
                    <FieldLabel optional>City / service area</FieldLabel>
                    <Input value={form.serviceArea} onChange={update("serviceArea")} placeholder="Denver metro, North Dallas…" ariaLabel="City or service area" name="serviceArea" autoComplete="address-level2" />
                  </div>
                  <div>
                    <FieldLabel optional>Missed calls per week</FieldLabel>
                    <Select value={form.callVolume} onChange={update("callVolume")} ariaLabel="Approximate missed calls per week" name="callVolume">
                      {callVolumes.map((item) => <option key={item}>{item}</option>)}
                    </Select>
                  </div>
                  <div>
                    <FieldLabel optional>Google Ads or LSAs?</FieldLabel>
                    <Select value={form.runsAds} onChange={update("runsAds")} ariaLabel="Do you run Google Ads or Local Services Ads?" name="runsAds">
                      {adOptions.map((item) => <option key={item}>{item}</option>)}
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel optional>Calendar / booking system</FieldLabel>
                    <Select value={form.bookingSystem} onChange={update("bookingSystem")} ariaLabel="Calendar or booking system" name="bookingSystem">
                      {bookingSystems.map((item) => <option key={item}>{item}</option>)}
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <FieldLabel optional>Setup details</FieldLabel>
                  <textarea
                    value={form.message}
                    onChange={(event) => update("message")(event.target.value)}
                    rows={4}
                    name="message"
                    aria-label="Setup details"
                    placeholder="Tell us what you want Bellory to help with first: missed calls, after-hours calls, overflow, booking, emergency transfers, or call summaries."
                    className="w-full rounded-xl border border-white/[.09] bg-[#13100B]/80 p-4 text-sm leading-6 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,.25)] outline-none transition placeholder:text-[#94836A] focus:border-[#C7F76F]/45 focus-visible:ring-2 focus-visible:ring-[#C7F76F]/20"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button disabled={status === "saving"} type="submit" className="mt-6 w-full py-3.5 text-sm">
            {status === "saving" ? "Setting it up…" : "Start my free month"} <ArrowRight size={15} />
          </Button>
          <p className="font-mono-ui mt-3 text-center text-[10px] tracking-[.06em] text-[#94836A]">No spam — we only use this to contact you about Bellory installs.</p>
          <p className="font-mono-ui mt-1.5 text-center text-[10px] tracking-[.06em] text-[#94836A]">
            Not ready?{" "}
            <a
              href={demoPhoneHref}
              onClick={() => trackLandingEvent("demo_call_click", { location: `form_${source}` })}
              className="text-[#A9D96B] underline decoration-[#A9D96B]/40 underline-offset-2 transition hover:text-[#D8FF9B]"
            >
              Call the live demo first: {demoPhoneDisplay}
            </a>
          </p>
          {message && (
            <p aria-live="polite" className={`mt-3 text-center text-[13px] leading-5 ${status === "error" ? "text-[#F08B72]" : "text-[#C7F76F]"}`}>{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

function LeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#100E0A]/85 p-4 backdrop-blur-xl" onMouseDown={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative my-8 w-full max-w-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Start your free Bellory month"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 grid size-10 place-items-center rounded-full border border-white/10 bg-[#17130E] text-[#FFF7E8] shadow-xl transition hover:bg-white/[.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/35"
          aria-label="Close free month form"
        >
          <X size={18} />
        </button>
        <WaitlistCard source="landing_modal" />
      </motion.div>
    </div>
  );
}

function StickyMobileCTA({ onRequest }: { onRequest: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[.08] bg-[#100E0A]/92 p-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2">
        <Button onClick={onRequest} className="py-3">Start my free month</Button>
        <a
          href={demoPhoneHref}
          onClick={() => trackLandingEvent("demo_call_click", { location: "sticky_mobile" })}
          aria-label="Call the live demo"
          className="grid place-items-center rounded-xl border border-[#C7F76F]/30 bg-[#C7F76F]/[.08] px-3.5 py-3 text-[#C7F76F] transition hover:bg-[#C7F76F]/[.14] active:translate-y-px"
        >
          <PhoneCall size={16} />
        </a>
      </div>
    </div>
  );
}

/* --------------------------------- page ---------------------------------- */

export function LandingPage() {
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const scrollDepthTracked = useRef<Set<number>>(new Set());

  useEffect(() => {
    const thresholds = [25, 50, 75, 100];
    const handleScroll = () => {
      const documentHeight = document.documentElement.scrollHeight;
      if (documentHeight <= window.innerHeight) return;

      const depth = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / documentHeight) * 100));
      thresholds.forEach((threshold) => {
        if (depth >= threshold && !scrollDepthTracked.current.has(threshold)) {
          scrollDepthTracked.current.add(threshold);
          trackLandingEvent("scroll_depth", { depth: threshold });
        }
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openLeadModal = (location: string, eventName = "request_private_install_click") => {
    trackLandingEvent(eventName, { location });
    setLeadModalOpen(true);
  };

  return (
    <MotionConfig reducedMotion="user">
    <main className="grain relative min-h-screen overflow-hidden text-[#FFF7E8]">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-[-20rem] h-[42rem] w-[46rem] -translate-x-1/2 rounded-full bg-[#C7F76F]/[.07] blur-3xl" />
        <div className="absolute bottom-[-18rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-[#F6C66A]/[.06] blur-3xl" />
        <div className="grid-glow absolute inset-x-0 top-0 h-[34rem] opacity-50" />
      </div>

      {/* announcement bar */}
      <div className="relative z-10 border-b border-white/[.06] bg-[#C7F76F]/[.04]">
        <p className="font-mono-ui mx-auto max-w-[1180px] px-5 py-2 text-center text-[10px] font-semibold uppercase tracking-[.2em] text-[#A9D96B]">
          Now installing · Built for garage door companies
        </p>
      </div>

      {/* header */}
      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => trackLandingEvent("nav_logo_click")}>
          <Image src="/brand/bellory-bell.png" alt="Bellory" width={40} height={40} className="drop-shadow-[0_10px_24px_rgba(199,247,111,.2)]" priority />
          <div>
            <p className="font-display text-[21px] font-semibold tracking-[-.02em] text-white">Bellory</p>
            <p className="font-mono-ui -mt-0.5 text-[10px] font-semibold uppercase tracking-[.24em] text-[#94836A]">AI receptionist</p>
          </div>
        </Link>
        <Button onClick={() => openLeadModal("header", "header_cta_click")}>
          <span className="hidden sm:inline">Start my free month</span>
          <span className="sm:hidden">Free month</span>
        </Button>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto grid max-w-[1180px] gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-8 lg:pb-24">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.21, 0.6, 0.35, 1] }}>
          <div className="mb-6 flex items-center gap-3">
            <span className="pulse-ring size-1.5 rounded-full bg-[#C7F76F]" />
            <MonoTag>Done-for-you AI receptionist</MonoTag>
          </div>
          <h1 className="font-display text-[clamp(2.6rem,5.3vw,4.3rem)] font-medium leading-[1.0] tracking-[-.025em] text-[#FFF7E8]">
            It’s 9:47 PM. A spring
            <br />
            just snapped.
            <br />
            <span className="text-[#C7F76F]">Bellory answers.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#C6B9A6] sm:text-lg sm:leading-8">
            Missed and after-hours garage door calls become booked jobs instead of competitor wins. We configure Bellory around your services, schedule, service area, and emergency rules — so you never manage another app.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={() => openLeadModal("hero", "hero_cta_click")} className="px-6 py-3.5 text-sm">
              Start my free month <ArrowRight size={15} />
            </Button>
            <a
              href={demoPhoneHref}
              onClick={() => trackLandingEvent("demo_call_click", { location: "hero" })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[.12] bg-white/[.05] px-3 py-3.5 text-[13px] font-bold tracking-[-.01em] text-[#FFF7E8] shadow-[0_1px_0_rgba(255,247,232,.05)_inset] transition-all duration-150 hover:border-white/[.2] hover:bg-white/[.08] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#100E0A] sm:px-6 sm:text-sm"
            >
              <PhoneCall size={15} className="shrink-0" /> Call the live demo — {demoPhoneDisplay}
            </a>
          </div>
          <p className="font-mono-ui mt-3 text-[10px] leading-5 tracking-[.08em] text-[#94836A]">
            <span className="block">Free install · pay nothing if month one doesn’t book you jobs · no contract</span>
            <span className="block">Call the demo right now — after hours is the whole point.</span>
          </p>
          <div className="font-mono-ui mt-9 flex flex-wrap gap-x-8 gap-y-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#94836A]">
            <span className="flex items-center gap-2"><Check size={12} className="text-[#94C759]" /> 24/7 coverage</span>
            <span className="flex items-center gap-2"><Check size={12} className="text-[#94C759]" /> Books by your rules</span>
            <span className="flex items-center gap-2"><Check size={12} className="text-[#94C759]" /> Humans stay in the loop</span>
          </div>
        </motion.div>

        <div className="flex justify-center lg:justify-end">
          <CallTicket />
        </div>
      </section>

      <CallLogTicker />

      {/* the cost of voicemail */}
      <Section id="proof">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <SectionMark index="01" label="The problem" />
            <DisplayHeading>Garage door calls don’t wait for voicemail.</DisplayHeading>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#B7AB98]">
              When someone has a broken spring, a door stuck open, or a car trapped inside, they usually hire the company that answers first. Bellory catches those missed and after-hours calls before they turn into competitor jobs.
            </p>
            <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.05] sm:grid-cols-2">
              {[
                ["A ring with no answer", "is a lead you already paid for, walking away."],
                ["A voicemail greeting", "is where urgent callers hang up and redial."],
              ].map(([lead, rest]) => (
                <div key={lead} className="bg-[#16120C] p-5">
                  <p className="text-[14px] font-bold text-[#F4EAD5]">{lead}</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-[#94836A]">{rest}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="glass relative overflow-hidden rounded-[22px] p-7 sm:p-9">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(246,198,106,.08),transparent_40%)]" aria-hidden="true" />
              <MonoTag tone="honey">Back-of-the-napkin math</MonoTag>
              <div className="mt-6 space-y-4">
                <div className="flex items-baseline justify-between border-b border-white/[.06] pb-4">
                  <span className="text-[13px] text-[#B7AB98]">Missed jobs per month</span>
                  <span className="font-mono-ui text-xl font-bold text-white">20</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-white/[.06] pb-4">
                  <span className="text-[13px] text-[#B7AB98]">Average repair ticket</span>
                  <span className="font-mono-ui text-xl font-bold text-white">$350</span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[13px] font-semibold text-[#F4EAD5]">Revenue walking away</span>
                  <span className="font-display text-5xl font-medium tracking-[-.02em] text-[#F6C66A]">$7,000</span>
                </div>
              </div>
              <div className="rule-dashed mt-7 opacity-50" />
              <p className="font-mono-ui mt-4 text-[10px] leading-4 tracking-[.04em] text-[#94836A]">
                Example only: 20 missed jobs × $350 average ticket. Your numbers will differ — that’s what the install review is for.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* how it works */}
      <Section id="how-it-works" className="pt-4 sm:pt-8">
        <div>
          <SectionMark index="02" label="How it works" />
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <DisplayHeading>We run the setup.<br className="hidden sm:block" /> You run the business.</DisplayHeading>
            <p className="max-w-sm text-base leading-7 text-[#B7AB98]">
              Most garage door owners don’t want another dashboard. Bellory is configured, tested, and supported for you.
            </p>
          </div>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-[22px] border border-white/[.07] bg-white/[.05] md:grid-cols-3">
          {howSteps.map((step) => (
            <div key={step.num} className="group h-full bg-[#16120C] p-7 transition-colors hover:bg-[#1A150E] sm:p-8">
              <p className="font-display text-[54px] font-medium leading-none tracking-[-.03em] text-white/[.08] transition-colors group-hover:text-[#C7F76F]/[.16]">{step.num}</p>
              <h3 className="mt-6 text-lg font-bold tracking-[-.02em] text-white">{step.title}</h3>
              <p className="mt-3 text-[13px] leading-7 text-[#94836A]">{step.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <DemoSection />

      {/* human sound */}
      <Section>
        <div className="glass relative overflow-hidden rounded-[26px] p-8 sm:p-12 lg:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(199,247,111,.08),transparent_38%)]" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SectionMark index="04" label="Human sound" />
              <DisplayHeading>It should never feel like a phone tree.</DisplayHeading>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#B7AB98]">
                Bellory speaks like a calm front-desk person: it pauses, clarifies, handles interruptions, and escalates instead of forcing callers through a script. When a human is needed, it says so naturally and hands the call over.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {["Natural pacing", "Handles interruptions", "One question at a time", "Never invents pricing", "Escalates when unsure"].map((chip) => (
                  <span key={chip} className="font-mono-ui rounded-full border border-white/[.1] bg-white/[.03] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#C6B9A6]">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="mx-auto flex flex-col items-center gap-5">
                <div className="relative grid size-36 place-items-center rounded-full border border-[#C7F76F]/[.14] bg-[#C7F76F]/[.04] sm:size-44">
                  <div className="absolute inset-3 rounded-full border border-dashed border-[#C7F76F]/[.16]" />
                  <Bell size={44} className="text-[#C7F76F]" strokeWidth={1.4} />
                </div>
                <p className="font-display text-4xl font-medium tracking-[-.02em] text-white sm:text-5xl">24/7</p>
                <p className="font-mono-ui max-w-[220px] text-center text-[10px] font-semibold uppercase leading-5 tracking-[.16em] text-[#94836A]">
                  Missed calls · overflow · lunch breaks · after hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* setup / no app */}
      <Section id="setup" className="pt-2 sm:pt-4">
        <div className="grid gap-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div>
            <SectionMark index="05" label="Done-for-you" />
            <DisplayHeading>No new software for your team to learn.</DisplayHeading>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#B7AB98]">
              We use our own setup panel to configure your call flow around how your business already works. Your team gets results — a booked job, a transfer, or a clean summary — not another login.
            </p>
            <div className="mt-8 space-y-5">
              {[
                { icon: ClipboardCheck, title: "We configure it", text: "Services, hours, service area, emergency rules, booking logic, and fallback contacts." },
                { icon: Wrench, title: "We test it", text: "Broken spring, opener repair, off-track door, stuck-open door, new door estimate, after-hours." },
                { icon: Headphones, title: "We support it", text: "Call flow change, pricing language update, new service area — we handle it with you." },
              ].map((item, index) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#C7F76F]/[.08] text-[#C7F76F] shadow-[inset_0_0_0_1px_rgba(199,247,111,.14)]">
                      <item.icon size={16} strokeWidth={1.9} />
                    </span>
                    {index < 2 && <span className="mt-2 h-full w-px bg-gradient-to-b from-white/[.12] to-transparent" />}
                  </div>
                  <div className="pb-2">
                    <p className="text-[15px] font-bold tracking-[-.01em] text-white">{item.title}</p>
                    <p className="mt-1.5 text-[13px] leading-6 text-[#94836A]">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="glass overflow-hidden rounded-[22px]">
              <div className="flex items-center justify-between border-b border-white/[.07] px-6 py-4">
                <div>
                  <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.2em] text-[#94836A]">Bellory setup review</p>
                  <p className="mt-1 text-[15px] font-bold tracking-[-.01em] text-white">Garage door call flow</p>
                </div>
                <span className="font-mono-ui flex items-center gap-2 rounded-md border border-[#C7F76F]/25 bg-[#C7F76F]/[.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-[#D8FF9B]">
                  <span className="size-1.5 rounded-full bg-[#C7F76F]" /> Configured with you
                </span>
              </div>
              <div className="grid gap-px bg-white/[.04] sm:grid-cols-2">
                {setupChecklist.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 bg-[#16120C] px-6 py-4">
                    <span className="font-mono-ui w-6 text-[10px] text-[#94836A]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-[13px] font-semibold text-[#EFE1C8]">{item}</span>
                    <Check size={13} className="ml-auto text-[#94C759]" />
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[.07] bg-[#C7F76F]/[.03] px-6 py-4">
                <p className="text-[13px] leading-6 text-[#D8FF9B]">You don’t manage this yourself. Bellory setup and support are handled by humans.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* who it's for */}
      <Section className="pt-2 sm:pt-4">
        <div>
          <SectionMark index="06" label="Built for" />
          <DisplayHeading className="max-w-3xl">For companies that can’t afford to miss the ring.</DisplayHeading>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-[22px] border border-white/[.07] bg-white/[.05] sm:grid-cols-2">
          {whoRows.map(([title, text], index) => (
            <div key={title}>
              <div className="flex h-full gap-5 bg-[#16120C] p-7">
                <span className="font-mono-ui pt-1 text-[11px] text-[#94836A]">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-[15px] font-bold tracking-[-.01em] text-white">{title}</p>
                  <p className="mt-2 text-[13px] leading-6 text-[#94836A]">{text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* trust guardrails */}
        <div className="mt-16 grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <MonoTag tone="honey">Trust guardrails</MonoTag>
            <h3 className="font-display mt-4 text-3xl font-medium leading-[1.05] tracking-[-.02em] text-white sm:text-4xl">
              Built for the calls you can’t afford to mishandle.
            </h3>
            <p className="mt-4 max-w-sm text-base leading-7 text-[#B7AB98]">
              Bellory touches customers, scheduling, and urgent details. Every install is private, rule-based, and backed by human fallback paths.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item.title} className="glass h-full rounded-[18px] p-6">
                <item.icon size={18} className="text-[#C7F76F]" strokeWidth={1.8} />
                <p className="mt-4 text-[15px] font-bold tracking-[-.01em] text-white">{item.title}</p>
                <p className="mt-2 text-[13px] leading-6 text-[#94836A]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <FAQSection />

      {/* final CTA + waitlist */}
      <Section className="pb-24 pt-4 sm:pb-28 sm:pt-8">
        <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <SectionMark index="08" label="First month free" />
            <DisplayHeading>Put Bellory on your next missed call.</DisplayHeading>
            <p className="mt-6 max-w-md text-base leading-7 text-[#B7AB98]">
              We open garage door installs in small batches so each business gets configured, tested, and supported correctly before Bellory answers real callers.
            </p>
            <div className="mt-9 space-y-0 border-t border-white/[.07]">
              {["Done-for-you setup", "Garage door call flow", "Calendar or booking logic", "Emergency fallback routing"].map((item, index) => (
                <div key={item} className="flex items-center gap-4 border-b border-white/[.07] py-4">
                  <span className="font-mono-ui text-[10px] text-[#94836A]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[14px] font-semibold text-[#EFE1C8]">{item}</span>
                  <Check size={14} className="ml-auto text-[#94C759]" />
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-[18px] border border-white/[.07] bg-white/[.02] p-5">
              <MonoTag tone="honey">From the builders</MonoTag>
              <p className="mt-3 text-[13px] leading-6 text-[#B7AB98]">
                Bellory is run by the two people who built it. When you call, text, or want your call flow changed, you get us directly — not a support queue. We’re launching with a handful of garage door companies and shaping it around their real calls.
              </p>
            </div>
          </div>
          <div>
            <WaitlistCard id="waitlist" source="landing_bottom" />
          </div>
        </div>
      </Section>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/[.06] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/brand/bellory-bell.png" alt="" width={28} height={28} />
            <p className="font-mono-ui text-[11px] tracking-[.04em] text-[#94836A]">
              Bellory — done-for-you AI receptionist installs for garage door companies.
            </p>
          </div>
          <div className="font-mono-ui flex flex-wrap gap-6 text-[10px] font-semibold uppercase tracking-[.16em]">
            <Link href="/privacy" className="text-[#94836A] transition hover:text-white">Privacy</Link>
            <Link href="/terms" className="text-[#94836A] transition hover:text-white">Terms</Link>
            <Link href="/contact" className="text-[#94836A] transition hover:text-white">Contact</Link>
            <a href="#waitlist" className="flex items-center gap-1 text-[#C7F76F] transition hover:text-[#D8FF9B]">
              Start free month <ArrowUpRight size={11} />
            </a>
          </div>
        </div>
      </footer>

      <StickyMobileCTA onRequest={() => openLeadModal("sticky_mobile", "mobile_sticky_cta_click")} />
      <LeadModal open={leadModalOpen} onClose={() => setLeadModalOpen(false)} />
    </main>
    </MotionConfig>
  );
}
