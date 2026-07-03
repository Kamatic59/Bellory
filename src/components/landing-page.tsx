"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";
import { AnimatePresence, motion } from "framer-motion";
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
  Pause,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  Play,
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
type AudioContextConstructor = new () => AudioContext;
type AudioWindow = Window & { webkitAudioContext?: AudioContextConstructor };
type PhoneAudioGraph = { context: AudioContext; source: MediaElementAudioSourceNode };

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

const demoAudioSrc = "/audio/bellory-garage-door-demo-v3.mp3";

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
  { at: "0:01", speaker: "Bellory", text: "Thanks for calling Canyon Garage Doors, this is Bellory. How can I help?" },
  { at: "0:06", speaker: "Caller", text: "My garage door spring broke and the door won’t open. My car is stuck inside." },
  { at: "0:13", speaker: "Bellory", text: "I can help with that. Is the door stuck fully closed, or is it off track too?" },
  { at: "0:19", speaker: "Caller", text: "It looks closed. I don’t think it’s off track." },
  { at: "0:24", speaker: "Bellory", text: "Got it. Because your car is trapped, I’ll treat this as urgent. Let me check the soonest opening, and if I can’t get this placed right away, I’ll forward you to someone who can help better." },
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

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.6, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Waveform({ active = true, bars = 22 }: { active?: boolean; bars?: number }) {
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
          animate={active ? { height: [`${height * 0.4}%`, `${height}%`, `${height * 0.6}%`] } : { height: "18%" }}
          transition={{ duration: 1.1 + (index % 5) * 0.09, repeat: active ? Infinity : 0, repeatType: "mirror", ease: "easeInOut" }}
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
      transition={{ delay: 0.25, duration: 0.7, ease: [0.21, 0.6, 0.35, 1] }}
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
              transition={{ delay: 0.7 + index * 0.45, duration: 0.4 }}
              className="grid grid-cols-[64px_1fr] gap-3"
            >
              <p className="font-mono-ui pt-0.5 text-[10px] leading-4 text-[#6E5F49]">{line.at.replace(" PM", "")}</p>
              <div>
                <p className={`font-mono-ui mb-1 text-[9px] font-semibold uppercase tracking-[.2em] ${line.speaker === "bellory" ? "text-[#A9D96B]" : "text-[#94836A]"}`}>
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
            transition={{ delay: 2.6, duration: 0.3, ease: "backOut" }}
            className="stamp text-[#C7F76F]"
          >
            <Check size={11} strokeWidth={3} /> Booked · 7:30 AM
          </motion.span>
        </div>
      </div>

      <p className="font-mono-ui mt-3 text-center text-[10px] tracking-[.08em] text-[#6E5F49]">Illustrative call — every install is configured to its own rules</p>
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
              <span className="text-[#6E5F49]">{line.time}</span>
              <span className="text-[#C6B9A6]">{line.issue}</span>
              <span className="text-[#94C759]">→ {line.result}</span>
              <span className="ml-4 size-1 rounded-full bg-[#4A3F2E]" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
      <p className="font-mono-ui mt-2 px-5 text-center text-[9px] uppercase tracking-[.24em] text-[#544733]">Illustrative call log</p>
    </div>
  );
}

/* ------------------------------ demo section ------------------------------ */

function DemoSection() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioGraphRef = useRef<PhoneAudioGraph | null>(null);
  const [audioStatus, setAudioStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [audioMessage, setAudioMessage] = useState("");
  const playing = audioStatus === "playing";

  const ensurePhoneAudioGraph = async () => {
    const audio = audioRef.current;
    if (!audio || typeof window === "undefined") return;

    const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioGraphRef.current) {
      const context = new AudioContextClass();
      const source = context.createMediaElementSource(audio);
      const highpass = context.createBiquadFilter();
      const lowpass = context.createBiquadFilter();
      const compressor = context.createDynamicsCompressor();
      const gain = context.createGain();

      highpass.type = "highpass";
      highpass.frequency.value = 320;
      lowpass.type = "lowpass";
      lowpass.frequency.value = 3400;
      compressor.threshold.value = -24;
      compressor.knee.value = 18;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.16;
      gain.gain.value = 0.96;

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(compressor);
      compressor.connect(gain);
      gain.connect(context.destination);
      audioGraphRef.current = { context, source };
    }

    if (audioGraphRef.current.context.state === "suspended") {
      await audioGraphRef.current.context.resume();
    }
  };

  const playDemo = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      trackLandingEvent("demo_audio_pause", { location: "demo_section" });
      return;
    }

    setAudioStatus("loading");
    setAudioMessage("");
    trackLandingEvent("demo_play_click", { location: "demo_section" });

    try {
      await ensurePhoneAudioGraph();
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Audio playback failed.";
      setAudioStatus("error");
      setAudioMessage("The demo audio could not play. Try the audio controls below or check your browser sound settings.");
      trackLandingEvent("demo_audio_error", { location: "demo_section", error: errorMessage });
    }
  };

  const requestInstall = () => {
    trackLandingEvent("demo_section_cta_click", { target: "waitlist" });
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Section id="demo">
      <Reveal>
        <SectionMark index="03" label="Hear it" />
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <DisplayHeading>One broken-spring call,<br className="hidden sm:block" /> start to finish.</DisplayHeading>
          <p className="max-w-sm text-[15px] leading-7 text-[#B7AB98]">What Bellory asks, what it checks, and what your team receives after the caller hangs up.</p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
        {/* player + transcript */}
        <Reveal>
          <div className="glass overflow-hidden rounded-[22px]">
            <div className="flex flex-col gap-4 border-b border-white/[.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={playDemo}
                  disabled={audioStatus === "loading"}
                  aria-label={playing ? "Pause demo call" : "Play demo call"}
                  className="grid size-14 shrink-0 place-items-center rounded-full bg-[#C7F76F] text-[#14110B] shadow-[0_10px_30px_rgba(199,247,111,.22)] transition hover:bg-[#D8FF9B] active:scale-95 disabled:opacity-60"
                >
                  {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                <div>
                  <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.2em] text-[#94836A]">Recorded demo · 9:47 PM scenario</p>
                  <p className="mt-1 text-lg font-bold tracking-[-.02em] text-white">Broken spring, car trapped</p>
                </div>
              </div>
              <div className="hidden sm:block"><Waveform active={playing} bars={16} /></div>
            </div>

            <div className="p-5 sm:p-6">
              <audio
                ref={audioRef}
                src={demoAudioSrc}
                preload="metadata"
                controls
                className="w-full rounded-xl border border-white/[.07] bg-[#13100B]/70"
                onPlay={() => {
                  void ensurePhoneAudioGraph();
                  setAudioStatus("playing");
                  setAudioMessage("");
                }}
                onPause={() => setAudioStatus("idle")}
                onEnded={() => {
                  setAudioStatus("idle");
                  audioRef.current?.load();
                }}
                onError={() => {
                  setAudioStatus("error");
                  setAudioMessage("The demo audio could not load. Please refresh and try again.");
                  trackLandingEvent("demo_audio_error", { location: "demo_section", error: "audio_element_error" });
                }}
              />
              <p className="font-mono-ui mt-2.5 text-[10px] leading-4 tracking-[.04em] text-[#6E5F49]">
                Human-style phone sample. Final installs use the configured Bellory voice for that business.
              </p>
              {audioMessage && <p className="mt-2 text-[12px] leading-5 text-[#F08B72]">{audioMessage}</p>}

              <div className="mt-6 space-y-4">
                {demoTranscript.map((line, index) => (
                  <div key={index} className="grid grid-cols-[44px_1fr] gap-3.5">
                    <p className="font-mono-ui pt-0.5 text-[10px] text-[#6E5F49]">{line.at}</p>
                    <div className={`rounded-xl border p-3.5 transition-colors ${playing ? "border-[#C7F76F]/[.16] bg-[#C7F76F]/[.03]" : "border-white/[.06] bg-white/[.015]"}`}>
                      <p className={`font-mono-ui mb-1.5 text-[9px] font-semibold uppercase tracking-[.2em] ${line.speaker === "Bellory" ? "text-[#A9D96B]" : "text-[#94836A]"}`}>{line.speaker}</p>
                      <p className="text-[13px] leading-6 text-[#EFE1C8]">{line.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* receipt + before/after */}
        <div className="flex flex-col gap-5">
          <Reveal delay={0.08}>
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
              <p className="font-mono-ui mt-4 text-center text-[9px] uppercase tracking-[.3em] text-[#544733]">· · · Bellory · · ·</p>
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="glass rounded-[22px] p-5 sm:p-6">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <p className="font-mono-ui flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#94836A]"><PhoneMissed size={12} /> Without Bellory</p>
                <p className="font-mono-ui flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#A9D96B]"><PhoneCall size={12} /> With Bellory</p>
              </div>
              <div className="space-y-2">
                {beforeAfterRows.map(([before, after]) => (
                  <div key={before} className="grid grid-cols-2 gap-3 rounded-xl border border-white/[.05] bg-white/[.015] p-3">
                    <p className="flex items-start gap-2 text-[12px] leading-5 text-[#94836A]"><Minus size={12} className="mt-1 shrink-0 opacity-60" /> {before}</p>
                    <p className="flex items-start gap-2 text-[12px] font-semibold leading-5 text-[#D8FF9B]"><Check size={12} className="mt-1 shrink-0" /> {after}</p>
                  </div>
                ))}
              </div>
              <Button onClick={requestInstall} className="mt-5 w-full">
                Request a private install <ArrowRight size={14} />
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------- FAQ section ------------------------------ */

function FAQItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-t border-white/[.07]">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-6 py-5 text-left transition hover:opacity-80">
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
            <p className="max-w-2xl pb-6 text-[14px] leading-7 text-[#B7AB98]">{answer}</p>
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
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <SectionMark index="07" label="Questions" />
            <DisplayHeading>Asked before handing calls to AI.</DisplayHeading>
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-[#B7AB98]">
              The short version: Bellory is configured before launch, answers from your rules, and escalates when a human should take over.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
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
        </Reveal>
      </div>
    </Section>
  );
}

/* ------------------------------ waitlist form ------------------------------ */

function FieldLabel({ children, optional = false }: { children: ReactNode; optional?: boolean }) {
  return (
    <p className="font-mono-ui mb-2 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#94836A]">
      <span>{children}</span>
      {optional && <span className="text-[9px] tracking-[.12em] text-[#6E5F49]">Optional</span>}
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

    if (!form.name.trim() || !form.company.trim() || !form.email.trim() || !form.phone.trim() || !form.serviceArea.trim()) {
      setStatus("error");
      const validationMessage = "Add your name, business name, email, phone number, and service area so we can review your install.";
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
      setMessage("Request received. We will review your company and reach out if your install is a fit for the next private batch.");
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
          <MonoTag>Private install request</MonoTag>
          <h3 className="font-display mt-3 text-2xl font-medium tracking-[-.015em] text-white sm:text-3xl">Tell us about your company.</h3>
          <p className="mt-3 text-[13px] leading-6 text-[#B7AB98]">
            We open garage door installs in small batches so each business gets configured, tested, and supported correctly. Tell us the basics and we will review the fit.
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
              <FieldLabel>Business name</FieldLabel>
              <Input value={form.company} onChange={update("company")} placeholder="Company name" ariaLabel="Business name" name="company" autoComplete="organization" required />
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
              <FieldLabel>City / service area</FieldLabel>
              <Input value={form.serviceArea} onChange={update("serviceArea")} placeholder="Denver metro, North Dallas…" ariaLabel="City or service area" name="serviceArea" autoComplete="address-level2" required />
            </div>
            <div>
              <FieldLabel>Missed calls per week</FieldLabel>
              <Select value={form.callVolume} onChange={update("callVolume")} ariaLabel="Approximate missed calls per week" name="callVolume">
                {callVolumes.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Google Ads or LSAs?</FieldLabel>
              <Select value={form.runsAds} onChange={update("runsAds")} ariaLabel="Do you run Google Ads or Local Services Ads?" name="runsAds">
                {adOptions.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Calendar / booking system</FieldLabel>
              <Select value={form.bookingSystem} onChange={update("bookingSystem")} ariaLabel="Calendar or booking system" name="bookingSystem">
                {bookingSystems.map((item) => <option key={item}>{item}</option>)}
              </Select>
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
            {showDetails ? "Hide optional setup details" : "+ Add optional setup details"}
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
                <div className="mt-4">
                  <FieldLabel optional>Setup details</FieldLabel>
                  <textarea
                    value={form.message}
                    onChange={(event) => update("message")(event.target.value)}
                    rows={4}
                    name="message"
                    aria-label="Setup details"
                    placeholder="Tell us what you want Bellory to help with first: missed calls, after-hours calls, overflow, booking, emergency transfers, or call summaries."
                    className="w-full rounded-xl border border-white/[.09] bg-[#13100B]/80 p-4 text-sm leading-6 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,.25)] outline-none transition placeholder:text-[#6E5F49] focus:border-[#C7F76F]/45 focus-visible:ring-2 focus-visible:ring-[#C7F76F]/20"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button disabled={status === "saving"} type="submit" className="mt-6 w-full py-3.5 text-sm">
            {status === "saving" ? "Requesting install…" : "Request my private install"} <ArrowRight size={15} />
          </Button>
          <p className="font-mono-ui mt-3 text-center text-[10px] tracking-[.06em] text-[#6E5F49]">No spam — we only use this to contact you about Bellory installs.</p>
          {message && (
            <p aria-live="polite" className={`mt-3 text-center text-[12px] leading-5 ${status === "error" ? "text-[#F08B72]" : "text-[#C7F76F]"}`}>{message}</p>
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
        aria-label="Request private Bellory install"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 grid size-10 place-items-center rounded-full border border-white/10 bg-[#17130E] text-[#FFF7E8] shadow-xl transition hover:bg-white/[.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/35"
          aria-label="Close private install form"
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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[.08] bg-[#100E0A]/92 p-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2">
        <Button onClick={onRequest} className="py-3">Request private install</Button>
        <Button kind="secondary" onClick={onDemo} className="px-3.5 py-3" ariaLabel="Hear demo">
          <Headphones size={16} />
        </Button>
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

  const scrollToSection = (id: string, eventName: string) => {
    trackLandingEvent(eventName, { target: id });
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openLeadModal = (location: string, eventName = "request_private_install_click") => {
    trackLandingEvent(eventName, { location });
    setLeadModalOpen(true);
  };

  return (
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
          Private installs open · Garage door companies · Limited batches
        </p>
      </div>

      {/* header */}
      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5 sm:px-8">
        <a href="#" className="flex items-center gap-3" onClick={() => trackLandingEvent("nav_logo_click")}>
          <Image src="/brand/bellory-bell.png" alt="Bellory" width={40} height={40} className="drop-shadow-[0_10px_24px_rgba(199,247,111,.2)]" priority />
          <div>
            <p className="font-display text-[21px] font-semibold tracking-[-.02em] text-white">Bellory</p>
            <p className="font-mono-ui -mt-0.5 text-[9px] font-semibold uppercase tracking-[.24em] text-[#94836A]">AI receptionist</p>
          </div>
        </a>
        <nav className="font-mono-ui hidden items-center gap-7 text-[11px] font-semibold uppercase tracking-[.14em] text-[#B7AB98] md:flex">
          <a href="#how-it-works" className="transition hover:text-[#D8FF9B]">How it works</a>
          <a href="#demo" className="transition hover:text-[#D8FF9B]">Demo</a>
          <a href="#setup" className="transition hover:text-[#D8FF9B]">Setup</a>
          <a href="#faq" className="transition hover:text-[#D8FF9B]">FAQ</a>
        </nav>
        <Button onClick={() => openLeadModal("header", "header_cta_click")}>
          <span className="hidden sm:inline">Request private install</span>
          <span className="sm:hidden">Request install</span>
        </Button>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto grid max-w-[1180px] gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-8 lg:pb-24">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.21, 0.6, 0.35, 1] }}>
          <div className="mb-6 flex items-center gap-3">
            <span className="pulse-ring size-1.5 rounded-full bg-[#C7F76F]" />
            <MonoTag>Done-for-you AI receptionist</MonoTag>
          </div>
          <h1 className="font-display text-balance text-[2.9rem] font-medium leading-[1.0] tracking-[-.025em] text-[#FFF7E8] sm:text-7xl lg:text-[5.2rem]">
            It’s 9:47 PM.
            <br />
            A spring just snapped.
            <br />
            <span className="text-[#C7F76F]">Bellory answers.</span>
          </h1>
          <p className="mt-7 max-w-xl text-[16px] leading-8 text-[#C6B9A6] sm:text-lg">
            Missed and after-hours garage door calls become booked jobs instead of competitor wins. We configure Bellory around your services, schedule, service area, and emergency rules — so you never manage another app.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={() => openLeadModal("hero", "hero_cta_click")} className="px-6 py-3.5 text-sm">
              Request private install <ArrowRight size={15} />
            </Button>
            <Button kind="secondary" onClick={() => scrollToSection("demo", "secondary_cta_click")} className="px-6 py-3.5 text-sm">
              <Headphones size={15} /> Hear a real call flow
            </Button>
          </div>
          <div className="font-mono-ui mt-9 flex flex-wrap gap-x-8 gap-y-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#6E5F49]">
            <span className="flex items-center gap-2"><Check size={12} className="text-[#94C759]" /> 24/7 coverage</span>
            <span className="flex items-center gap-2"><Check size={12} className="text-[#94C759]" /> Books from your rules</span>
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
          <Reveal>
            <SectionMark index="01" label="The problem" />
            <DisplayHeading>Garage door calls don’t wait for voicemail.</DisplayHeading>
            <p className="mt-6 max-w-xl text-[15px] leading-8 text-[#B7AB98]">
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
          </Reveal>
          <Reveal delay={0.12}>
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
              <p className="font-mono-ui mt-4 text-[10px] leading-4 tracking-[.04em] text-[#6E5F49]">
                Example only: 20 missed jobs × $350 average ticket. Your numbers will differ — that’s what the install review is for.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* how it works */}
      <Section id="how-it-works" className="pt-4 sm:pt-8">
        <Reveal>
          <SectionMark index="02" label="How it works" />
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <DisplayHeading>We run the setup.<br className="hidden sm:block" /> You run the business.</DisplayHeading>
            <p className="max-w-sm text-[15px] leading-7 text-[#B7AB98]">
              Most garage door owners don’t want another dashboard. Bellory is configured, tested, and supported for you.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-[22px] border border-white/[.07] bg-white/[.05] md:grid-cols-3">
          {howSteps.map((step, index) => (
            <Reveal key={step.num} delay={index * 0.08}>
              <div className="group h-full bg-[#16120C] p-7 transition-colors hover:bg-[#1A150E] sm:p-8">
                <p className="font-display text-[54px] font-medium leading-none tracking-[-.03em] text-white/[.08] transition-colors group-hover:text-[#C7F76F]/[.16]">{step.num}</p>
                <h3 className="mt-6 text-lg font-bold tracking-[-.02em] text-white">{step.title}</h3>
                <p className="mt-3 text-[13px] leading-7 text-[#94836A]">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <DemoSection />

      {/* human sound */}
      <Section>
        <div className="glass relative overflow-hidden rounded-[26px] p-8 sm:p-12 lg:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(199,247,111,.08),transparent_38%)]" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <Reveal>
              <SectionMark index="04" label="Human sound" />
              <DisplayHeading>It should never feel like a phone tree.</DisplayHeading>
              <p className="mt-6 max-w-xl text-[15px] leading-8 text-[#B7AB98]">
                Bellory speaks like a calm front-desk person: it pauses, clarifies, handles interruptions, and escalates instead of forcing callers through a script. When a human is needed, it says so naturally and hands the call over.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {["Natural pacing", "Handles interruptions", "One question at a time", "Never invents pricing", "Escalates when unsure"].map((chip) => (
                  <span key={chip} className="font-mono-ui rounded-full border border-white/[.1] bg-white/[.03] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#C6B9A6]">
                    {chip}
                  </span>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
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
            </Reveal>
          </div>
        </div>
      </Section>

      {/* setup / no app */}
      <Section id="setup" className="pt-2 sm:pt-4">
        <div className="grid gap-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <Reveal>
            <SectionMark index="05" label="Done-for-you" />
            <DisplayHeading>No new software for your team to learn.</DisplayHeading>
            <p className="mt-6 max-w-xl text-[15px] leading-8 text-[#B7AB98]">
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
          </Reveal>
          <Reveal delay={0.12}>
            <div className="glass overflow-hidden rounded-[22px]">
              <div className="flex items-center justify-between border-b border-white/[.07] px-6 py-4">
                <div>
                  <p className="font-mono-ui text-[9px] font-semibold uppercase tracking-[.2em] text-[#94836A]">Bellory setup review</p>
                  <p className="mt-1 text-[15px] font-bold tracking-[-.01em] text-white">Garage door call flow</p>
                </div>
                <span className="font-mono-ui flex items-center gap-2 rounded-md border border-[#C7F76F]/25 bg-[#C7F76F]/[.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#D8FF9B]">
                  <span className="size-1.5 rounded-full bg-[#C7F76F]" /> Configured with you
                </span>
              </div>
              <div className="grid gap-px bg-white/[.04] sm:grid-cols-2">
                {setupChecklist.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 bg-[#16120C] px-6 py-4">
                    <span className="font-mono-ui w-6 text-[10px] text-[#544733]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-[13px] font-semibold text-[#EFE1C8]">{item}</span>
                    <Check size={13} className="ml-auto text-[#94C759]" />
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[.07] bg-[#C7F76F]/[.03] px-6 py-4">
                <p className="text-[13px] leading-6 text-[#D8FF9B]">You don’t manage this yourself. Bellory setup and support are handled by humans.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* who it's for */}
      <Section className="pt-2 sm:pt-4">
        <Reveal>
          <SectionMark index="06" label="Built for" />
          <DisplayHeading className="max-w-3xl">For companies that can’t afford to miss the ring.</DisplayHeading>
        </Reveal>
        <div className="mt-10 grid gap-px overflow-hidden rounded-[22px] border border-white/[.07] bg-white/[.05] sm:grid-cols-2">
          {whoRows.map(([title, text], index) => (
            <Reveal key={title} delay={index * 0.06}>
              <div className="flex h-full gap-5 bg-[#16120C] p-7">
                <span className="font-mono-ui pt-1 text-[11px] text-[#544733]">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-[15px] font-bold tracking-[-.01em] text-white">{title}</p>
                  <p className="mt-2 text-[13px] leading-6 text-[#94836A]">{text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* trust guardrails */}
        <div className="mt-16 grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <Reveal>
            <MonoTag tone="honey">Trust guardrails</MonoTag>
            <h3 className="font-display mt-4 text-3xl font-medium leading-[1.05] tracking-[-.02em] text-white sm:text-4xl">
              Built for the calls you can’t afford to mishandle.
            </h3>
            <p className="mt-4 max-w-sm text-[14px] leading-7 text-[#B7AB98]">
              Bellory touches customers, scheduling, and urgent details. Every install is private, rule-based, and backed by human fallback paths.
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustItems.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <div className="glass h-full rounded-[18px] p-6">
                  <item.icon size={18} className="text-[#C7F76F]" strokeWidth={1.8} />
                  <p className="mt-4 text-[15px] font-bold tracking-[-.01em] text-white">{item.title}</p>
                  <p className="mt-2 text-[13px] leading-6 text-[#94836A]">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <FAQSection />

      {/* final CTA + waitlist */}
      <Section className="pb-24 pt-4 sm:pb-28 sm:pt-8">
        <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <Reveal>
            <SectionMark index="08" label="Install review" />
            <DisplayHeading>Want Bellory catching your next missed call?</DisplayHeading>
            <p className="mt-6 max-w-md text-[15px] leading-8 text-[#B7AB98]">
              We open garage door installs in small batches so each business gets configured, tested, and supported correctly before Bellory answers real callers.
            </p>
            <div className="mt-9 space-y-0 border-t border-white/[.07]">
              {["Done-for-you setup", "Garage door call flow", "Calendar or booking logic", "Emergency fallback routing"].map((item, index) => (
                <div key={item} className="flex items-center gap-4 border-b border-white/[.07] py-4">
                  <span className="font-mono-ui text-[10px] text-[#544733]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[14px] font-semibold text-[#EFE1C8]">{item}</span>
                  <Check size={14} className="ml-auto text-[#94C759]" />
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <WaitlistCard id="waitlist" source="landing_bottom" />
          </Reveal>
        </div>
      </Section>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/[.06] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/brand/bellory-bell.png" alt="" width={28} height={28} />
            <p className="font-mono-ui text-[11px] tracking-[.04em] text-[#6E5F49]">
              Bellory — done-for-you AI receptionist installs for garage door companies.
            </p>
          </div>
          <div className="font-mono-ui flex flex-wrap gap-6 text-[10px] font-semibold uppercase tracking-[.16em]">
            <a href="/privacy" className="text-[#94836A] transition hover:text-white">Privacy</a>
            <a href="/terms" className="text-[#94836A] transition hover:text-white">Terms</a>
            <a href="/contact" className="text-[#94836A] transition hover:text-white">Contact</a>
            <a href="#waitlist" className="flex items-center gap-1 text-[#C7F76F] transition hover:text-[#D8FF9B]">
              Request install <ArrowUpRight size={11} />
            </a>
          </div>
        </div>
      </footer>

      <StickyMobileCTA onRequest={() => openLeadModal("sticky_mobile", "mobile_sticky_cta_click")} onDemo={() => scrollToSection("demo", "sticky_demo_click")} />
      <LeadModal open={leadModalOpen} onClose={() => setLeadModalOpen(false)} />
    </main>
  );
}
