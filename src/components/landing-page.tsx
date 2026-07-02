"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  Pause,
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
    title: "Asks garage door questions",
    text: "Broken spring, stuck-open door, off-track door, opener issue, trapped vehicle, and urgency.",
  },
  {
    icon: CalendarCheck,
    tone: "honey",
    step: "03",
    title: "Books or transfers",
    text: "Bellory books from your rules or routes urgent calls to a real person.",
  },
] as const;

const storySections = [
  {
    id: "proof",
    eyebrow: "Problem",
    title: "Garage door calls do not wait for voicemail.",
    text: "When someone has a broken spring, a door stuck open, or a car trapped inside, they usually call the company that answers first. Bellory helps catch those missed and after-hours calls before they turn into competitor jobs.",
    metric: "$7k+",
    metricLabel: "Potential monthly leakage from 20 missed $350 repair jobs",
    metricNote: "Example only: 20 missed jobs x $350 average ticket = $7,000 in lost revenue.",
    icon: BadgeDollarSign,
    tone: "honey",
  },
  {
    id: "human-sound",
    eyebrow: "Human sound",
    title: "It should not feel like a phone tree.",
    text: "Bellory is designed to speak like a calm front desk person. It can pause, clarify, handle interruptions, and escalate instead of forcing callers through a rigid script.",
    metric: "24/7",
    metricLabel: "Coverage for missed calls, overflow, lunch breaks, and after-hours calls",
    metricNote: "",
    icon: Headphones,
    tone: "mint",
  },
  {
    id: "done-for-you",
    eyebrow: "Done-for-you setup",
    title: "We set it up. You keep running the business.",
    text: "Most garage door owners do not want another dashboard to manage. During setup, we configure Bellory around your actual business rules: services, hours, service area, booking logic, emergency routing, call summaries, and fallback contacts.",
    metric: "1 install",
    metricLabel: "Custom receptionist setup per garage door business",
    metricNote: "",
    icon: ShieldCheck,
    tone: "blue",
  },
] as const;

const howSteps = [
  {
    icon: ClipboardCheck,
    tone: "honey",
    title: "We configure it for you",
    text: "Services, hours, service area, emergency rules, booking logic, fallback contacts, and summary preferences.",
  },
  {
    icon: PhoneCall,
    tone: "mint",
    title: "Bellory answers garage door calls",
    text: "It qualifies broken springs, stuck doors, opener issues, trapped vehicles, and after-hours emergencies.",
  },
  {
    icon: CalendarCheck,
    tone: "blue",
    title: "You get the result",
    text: "Bellory books, transfers, or summarizes based on your rules. No extra app for your team to live inside.",
  },
] as const;

const demoTranscript = [
  {
    speaker: "Caller",
    text: "My garage door spring broke and the door won't open.",
  },
  {
    speaker: "Bellory",
    text: "I can help. Is the door stuck open, stuck closed, or completely off track?",
  },
  {
    speaker: "Caller",
    text: "Stuck closed. My car is inside.",
  },
  {
    speaker: "Bellory",
    text: "Got it. I'll treat this as urgent, check the soonest availability, and route this based on the company's emergency rules.",
  },
] as const;

const beforeAfterRows = [
  ["Missed call goes to voicemail", "Call answered instantly"],
  ["Caller calls a competitor", "Caller gets qualified"],
  ["Owner finds out later", "Job is booked or escalated"],
  ["No clean call notes", "Summary sent to the team"],
] as const;

const callVolumes = ["1-2 missed calls/week", "3-10 missed calls/week", "10-25 missed calls/week", "25+ missed calls/week"];
const adOptions = ["Yes - Google Ads or LSAs", "Yes - both ads and SEO", "No paid ads right now", "Not sure"];
const bookingSystems = ["Google Calendar", "Outlook Calendar", "ServiceTitan / field software", "Jobber / Housecall Pro", "Manual scheduling", "Not sure yet"];

const trustItems = [
  { icon: ShieldCheck, title: "Emergency routing", text: "Trapped vehicles, stuck-open doors, and after-hours issues can route to the right person." },
  { icon: LockKeyhole, title: "Private install", text: "Every Bellory setup is built around one garage door company's call flow." },
  { icon: FileText, title: "Clean summaries", text: "Your team gets issue, urgency, service area, outcome, and next action." },
  { icon: AlertTriangle, title: "Rules before automation", text: "Bellory follows approved booking, transfer, consent, and fallback rules instead of guessing." },
] as const;

const faqs = [
  {
    question: "Do I have to manage another app?",
    answer: "No. Bellory is a done-for-you setup. We configure, test, and support the system with you.",
  },
  {
    question: "Is Bellory only for garage door companies?",
    answer: "For the first private installs, yes. We are starting with garage door companies so the call flows, emergency rules, and booking logic are built for this niche before expanding.",
  },
  {
    question: "Can Bellory handle urgent calls?",
    answer: "Yes. Bellory can identify situations like stuck-open doors, broken springs, trapped vehicles, off-track doors, and after-hours emergencies, then book or transfer based on your rules.",
  },
  {
    question: "Can it transfer calls to a real person?",
    answer: "Yes. You decide when Bellory should transfer and who it should contact.",
  },
  {
    question: "Can it book jobs?",
    answer: "Yes, if your calendar or booking process supports it. If not, Bellory can qualify the customer and send a clean summary to your team.",
  },
  {
    question: "Will it replace my office person?",
    answer: "No. Bellory is best for missed calls, overflow, lunch breaks, after-hours calls, and busy periods.",
  },
  {
    question: "What happens if Bellory does not know the answer?",
    answer: "It follows your approved rules and escalates to a human instead of guessing.",
  },
  {
    question: "How much work is setup?",
    answer: "You answer questions about your business. We handle the technical setup, call flow, testing, and support.",
  },
] as const;

const noAppCards = [
  {
    icon: ClipboardCheck,
    tone: "honey",
    title: "We configure it",
    text: "Services, hours, service area, emergency rules, booking logic, and fallback contacts.",
  },
  {
    icon: Check,
    tone: "mint",
    title: "We test it",
    text: "Broken spring, opener repair, off-track door, stuck-open door, new door estimate, and after-hours scenarios.",
  },
  {
    icon: Headphones,
    tone: "blue",
    title: "We support it",
    text: "Need a call flow changed, pricing language updated, or new service area added? We handle it with you.",
  },
] as const;

const adminItems = ["Services", "Service areas", "Business hours", "Emergency routing", "Booking rules", "Fallback contacts", "Call summaries", "Test scenarios"];
const demoAudioSrc = "/audio/bellory-garage-door-demo.wav";

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
                  <p className="text-[13px] font-black text-white">Incoming garage door call</p>
                  <p className="text-[11px] text-[#BCA98B]">Handled in a calm, human voice</p>
                </div>
              </div>
              <GlowPill>Live</GlowPill>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/[.07] bg-white/[.035] p-3.5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-[#BCA98B]">Caller</p>
                <p className="text-[16px] font-semibold leading-6 tracking-[-.03em] text-white">&quot;My garage door spring snapped and my car is stuck inside. Can someone come today?&quot;</p>
              </div>
              <div className="rounded-2xl border border-[#C7F76F]/12 bg-[#C7F76F]/[.04] p-3.5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-[#C7F76F]">Bellory</p>
                <p className="text-[13px] leading-6 text-[#FFF7E8]">&quot;I can help. I&apos;ll ask two quick questions, check the soonest availability, and flag this as urgent if it needs a human right away.&quot;</p>
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
        <div className="grid gap-6 lg:grid-cols-[.78fr_1fr] lg:items-center">
          <div>
            <Badge><Building2 size={12} /> Built for garage door companies</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.055em] text-white sm:text-5xl">Built for garage door companies that cannot afford to miss calls.</h2>
            <p className="mt-4 text-[15px] leading-8 text-[#D8CCB8]">
              If a broken spring, trapped vehicle, or stuck-open door lead hits voicemail, that job can go to the next company that answers.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Owner-operators", "You are on jobs, driving, quoting, or handling installs and cannot always answer."],
              ["Small teams", "Your office person gets busy, takes lunch, leaves for the day, or misses overflow calls."],
              ["Growing companies", "You are paying for Google leads, SEO, referrals, or ads and need more calls answered."],
              ["After-hours repair", "Stuck-open doors, broken springs, and trapped vehicles need quick handling."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/[.07] bg-[#15110C]/60 p-4 text-[13px] text-[#D8CCB8]">
                <Check size={14} className="mb-3 text-[#C7F76F]" />
                <p className="font-bold text-[#FFF7E8]">{title}</p>
                <p className="mt-2 leading-6">{text}</p>
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
        title="Done-for-you setup for garage door calls."
        text="We configure the call flow with you, test common garage door scenarios, and keep supporting it so your team does not have another app to manage."
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
            {section.metricNote && <p className="mt-3 text-[11px] leading-5 text-[#BCA98B]/80">{section.metricNote}</p>}
          </div>
        </div>
      </Card>
    </motion.article>
  );
}

function DemoSection() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioStatus, setAudioStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [audioMessage, setAudioMessage] = useState("");
  const playing = audioStatus === "playing";

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
    <section id="demo" className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionIntro
        eyebrow="Garage door call demo"
        title="See how Bellory handles a broken spring call."
        text="A realistic garage door call flow shows what Bellory asks, what it checks, and what your team receives after the call."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="overflow-hidden p-5 sm:p-7">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#C7F76F]">Broken spring scenario</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-.045em] text-white">Urgent garage door call</h3>
            </div>
            <Button onClick={playDemo} kind={playing ? "secondary" : "primary"} disabled={audioStatus === "loading"}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {audioStatus === "loading" ? "Loading audio..." : playing ? "Pause demo" : "Play call flow"}
            </Button>
          </div>
          <Waveform active={playing} />
          <audio
            ref={audioRef}
            src={demoAudioSrc}
            preload="metadata"
            controls
            className="mt-4 w-full rounded-xl border border-white/[.07] bg-[#15110C]/70"
            onPlay={() => {
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
          <p className="mt-3 text-[11px] leading-5 text-[#BCA98B]">
            Test sample for the website player. Final private installs use the configured Bellory voice for that business.
          </p>
          {audioMessage && <p className="mt-2 text-[12px] leading-5 text-[#F08B72]">{audioMessage}</p>}
          <div className="mt-5 space-y-3">
            {demoTranscript.map((line, index) => (
              <div
                key={`${line.speaker}-${index}`}
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
                <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#C7F76F]">Call outcome</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-.045em] text-white">Same-day repair handled</h3>
              </div>
              <IconBox icon={CalendarCheck} tone="mint" />
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Issue", "Broken spring"],
                ["Urgency", "High"],
                ["Vehicle trapped", "Yes"],
                ["Service needed", "Same-day repair"],
                ["Action", "Booked or transferred based on owner rules"],
                ["Summary", "Sent to the team"],
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
      <div className="mt-6">
        <Button onClick={requestInstall}>
          Request a private install <ArrowRight size={14} />
        </Button>
      </div>
    </section>
  );
}

function NoAppSection() {
  return (
    <section id="setup" className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionIntro
        eyebrow="No extra app"
        title="No new software for your team to learn."
        text="Bellory is managed for you. We use the admin panel during setup to configure your call flow, but your team does not need to live inside another app. When calls come in, you get the result: a booked job, a transfer, or a clean call summary."
        center
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {noAppCards.map((item) => (
          <Card key={item.title} className="p-5">
            <IconBox icon={item.icon} tone={item.tone} />
            <h3 className="mt-5 text-xl font-semibold tracking-[-.04em] text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#D8CCB8]">{item.text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function AdminPreviewSection() {
  return (
    <section className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[.78fr_1fr] lg:items-center">
        <SectionIntro
          eyebrow="Setup panel"
          title="Built around your garage door business rules."
          text="During your setup review, we walk through the admin panel with you and configure Bellory around how your business already handles calls."
        />
        <Card className="overflow-hidden p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#C7F76F]">Bellory setup review</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-.045em] text-white">Garage Door Call Flow</h3>
            </div>
            <IconBox icon={Building2} tone="mint" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {adminItems.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-[#15110C]/65 p-3 text-sm font-bold text-[#FFF7E8]">
                <Check size={14} className="text-[#C7F76F]" />
                {item}
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-2xl border border-[#C7F76F]/15 bg-[#C7F76F]/[.04] p-4 text-sm leading-7 text-[#D8FF9B]">
            You do not have to manage this yourself. Bellory setup and support are handled by humans.
          </p>
        </Card>
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
      <Card className="relative overflow-hidden p-5 sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(199,247,111,.11),transparent_34%)]" />
        <form onSubmit={submit} className="relative">
          <SectionTitle title="Request a private Bellory install" eyebrow="Private garage door installs" action={<IconBox icon={Sparkles} tone="honey" />} />
          <p className="mb-5 text-[13px] leading-6 text-[#D8CCB8]">
            We are opening garage door installs in small batches so each business gets configured, tested, and supported correctly. Tell us the basics and we will review if your company is a good fit.
          </p>

          <div className="rounded-2xl border border-[#C7F76F]/12 bg-[#C7F76F]/[.035] p-3 text-[12px] leading-5 text-[#D8FF9B]">
            No spam. We only use this to contact you about Bellory garage door installs.
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
              <Input value={form.name} onChange={update("name")} placeholder="Your name" ariaLabel="Name" name="name" autoComplete="name" required className="py-3.5" />
            </div>
            <div>
              <FieldLabel>Business name</FieldLabel>
              <Input value={form.company} onChange={update("company")} placeholder="Company name" ariaLabel="Business name" name="company" autoComplete="organization" required className="py-3.5" />
            </div>
            <div>
              <FieldLabel>Work email</FieldLabel>
              <Input value={form.email} onChange={update("email")} placeholder="you@company.com" type="email" ariaLabel="Work email" name="email" autoComplete="email" required className="py-3.5" />
            </div>
            <div>
              <FieldLabel>Phone number</FieldLabel>
              <Input value={form.phone} onChange={update("phone")} placeholder="Best number" type="tel" ariaLabel="Phone number" name="phone" autoComplete="tel" required className="py-3.5" />
            </div>
            <div>
              <FieldLabel>City / service area</FieldLabel>
              <Input value={form.serviceArea} onChange={update("serviceArea")} placeholder="Denver metro, North Dallas, etc." ariaLabel="City or service area" name="serviceArea" autoComplete="address-level2" required className="py-3.5" />
            </div>
            <div>
              <FieldLabel>Approx. missed calls per week</FieldLabel>
              <Select value={form.callVolume} onChange={update("callVolume")} ariaLabel="Approximate missed calls per week" name="callVolume" className="py-3.5">
                {callVolumes.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Do you run Google Ads or Local Services Ads?</FieldLabel>
              <Select value={form.runsAds} onChange={update("runsAds")} ariaLabel="Do you run Google Ads or Local Services Ads?" name="runsAds" className="py-3.5">
                {adOptions.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>What calendar or booking system do you use?</FieldLabel>
              <Select value={form.bookingSystem} onChange={update("bookingSystem")} ariaLabel="Calendar or booking system" name="bookingSystem" className="py-3.5">
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
                <div className="md:col-span-2">
                  <FieldLabel optional>Optional setup details</FieldLabel>
                  <textarea
                    value={form.message}
                    onChange={(event) => update("message")(event.target.value)}
                    rows={4}
                    name="message"
                    aria-label="Setup details"
                    placeholder="Tell us what you want Bellory to help with first: missed calls, after-hours calls, overflow, booking, emergency transfers, or call summaries."
                    className="w-full rounded-2xl border border-white/[.08] bg-[#15110C]/70 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-[#BCA98B] focus:border-[#C7F76F]/40 focus-visible:ring-2 focus-visible:ring-[#C7F76F]/20"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <Button disabled={status === "saving"} type="submit" className="mt-5 w-full py-3">
            {status === "saving" ? "Requesting install..." : "Request my private install"} <ArrowRight size={14} />
          </Button>
          <p className="mt-3 text-center text-[11px] leading-5 text-[#BCA98B]">No spam. We only use this to contact you about Bellory garage door installs.</p>
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
        aria-label="Request private Bellory install"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 grid size-10 place-items-center rounded-full border border-white/10 bg-[#15110C] text-[#FFF7E8] shadow-xl transition hover:bg-white/[.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/35"
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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[.08] bg-[#12100C]/90 p-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2">
        <Button onClick={onRequest} className="py-3">Request private install</Button>
        <Button kind="secondary" onClick={onDemo} className="px-3 py-3" ariaLabel="Hear demo">
          <Headphones size={16} />
        </Button>
      </div>
    </div>
  );
}

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
          <a href="#setup" className="hover:text-white">Setup</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <Button onClick={() => openLeadModal("header", "header_cta_click")}>Request private install</Button>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-86px)] max-w-[1180px] flex-col justify-center px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mx-auto max-w-5xl text-center">
          <Badge><span className="pulse-ring size-1.5 rounded-full bg-[#C7F76F]" /> Private installs for garage door companies</Badge>
          <h1 className="text-balance mx-auto mt-4 max-w-5xl text-5xl font-semibold leading-[.9] tracking-[-.075em] text-white sm:text-7xl lg:text-[5.7rem]">
            Turn missed garage door calls into booked jobs.
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#D8CCB8]">
            Bellory is a done-for-you AI receptionist for garage door companies. We configure it around your services, schedule, service area, emergency rules, and fallback contacts so you do not have to manage another app.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => openLeadModal("hero", "hero_cta_click")} className="px-5 py-3 text-sm">Request private install <ArrowRight size={15} /></Button>
            <Button kind="secondary" onClick={() => scrollToSection("how-it-works", "secondary_cta_click")} className="px-5 py-3 text-sm">See how Bellory works</Button>
          </div>
        </motion.div>

        <HumanCallCard />
      </section>

      <HowItWorksSection />

      <section className="relative z-10 mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-5 sm:gap-6">
          {storySections.map((section, index) => <StoryPanel key={section.id} section={section} index={index} />)}
        </div>
      </section>

      <DemoSection />
      <NoAppSection />
      <AdminPreviewSection />
      <WhoForSection />
      <TrustSection />
      <FAQSection />

      <section className="relative z-10 mx-auto grid max-w-[1180px] gap-8 px-4 pb-20 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[.82fr_1.18fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <div className="self-start"><Badge><Star size={12} /> Private install review</Badge></div>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-.055em] text-white sm:text-6xl">Want Bellory to catch your next missed repair call?</h2>
          <p className="mt-5 max-w-xl text-[15px] leading-8 text-[#D8CCB8]">We are opening garage door installs in small batches so each business gets configured, tested, and supported correctly before Bellory answers real callers.</p>
          <div className="mt-8 grid gap-3">
            {["Done-for-you setup", "Garage door call flow", "Calendar or booking logic", "Emergency fallback routing"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[13px] font-bold text-[#FFF7E8]"><Check size={15} className="text-[#C7F76F]" /> {item}</div>
            ))}
          </div>
        </div>
        <WaitlistCard id="waitlist" source="landing_bottom" />
      </section>

      <footer className="relative z-10 border-t border-white/[.06] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 text-[12px] text-[#BCA98B] md:flex-row md:items-center md:justify-between">
          <p>Bellory - done-for-you AI receptionist installs for garage door companies.</p>
          <div className="flex flex-wrap gap-4">
            <a href="/privacy" className="font-bold text-[#FFF7E8]">Privacy</a>
            <a href="/terms" className="font-bold text-[#FFF7E8]">Terms</a>
            <a href="/contact" className="font-bold text-[#FFF7E8]">Contact</a>
            <a href="#waitlist" className="font-bold text-[#C7F76F]">Request private install</a>
          </div>
        </div>
      </footer>

      <StickyMobileCTA onRequest={() => openLeadModal("sticky_mobile", "mobile_sticky_cta_click")} onDemo={() => scrollToSection("demo", "sticky_demo_click")} />
      <LeadModal open={leadModalOpen} onClose={() => setLeadModalOpen(false)} />
    </main>
  );
}
