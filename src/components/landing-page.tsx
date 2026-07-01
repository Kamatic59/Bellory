"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  Check,
  Headphones,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Badge, Button, Card, IconBox, Input, SectionTitle, Select } from "./ui";

type WaitlistForm = {
  name: string;
  email: string;
  company: string;
  phone: string;
  businessType: string;
  callVolume: string;
  message: string;
};

const defaultForm: WaitlistForm = {
  name: "",
  email: "",
  company: "",
  phone: "",
  businessType: "Home services",
  callVolume: "50-150 calls/month",
  message: "",
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
    text: "It asks what happened, checks urgency, service area, pricing rules, and calendar logic.",
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
    metricLabel: "possible monthly leakage from 20 missed $350 jobs",
    icon: BadgeDollarSign,
    tone: "honey",
  },
  {
    id: "how",
    eyebrow: "Human sound",
    title: "It should not feel like a robot reading a script.",
    text: "The voice experience is built around believable pacing: natural pauses, interruptions, warmer confirmations, and short follow-up questions that make the call feel handled by a calm front desk person.",
    metric: "24/7",
    metricLabel: "human-like coverage without hiring overnight staff",
    icon: Headphones,
    tone: "mint",
  },
  {
    id: "setup",
    eyebrow: "Configuration",
    title: "Every business gets its own operating brain.",
    text: "Bellory is configured with services, FAQs, pricing rules, service areas, calendar logic, urgent triggers, fallback contacts, consent language, and reporting so it can actually run the phone desk.",
    metric: "1 setup",
    metricLabel: "custom receptionist per business, not a generic chatbot",
    icon: ShieldCheck,
    tone: "blue",
  },
] as const;

const businessTypes = ["Home services", "Dental / medical office", "Legal office", "Real estate", "Wellness / salon", "Other"];
const callVolumes = ["Under 50 calls/month", "50-150 calls/month", "150-500 calls/month", "500+ calls/month"];

function GlowPill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[#C7F76F]/20 bg-[#C7F76F]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.16em] text-[#D8FF9B]">{children}</span>;
}

function Waveform() {
  const bars = useMemo(() => [28, 48, 34, 72, 42, 88, 53, 35, 66, 46, 80, 31, 58, 39, 71, 45], []);

  return (
    <div className="flex h-16 items-center gap-1.5 rounded-2xl border border-[#C7F76F]/10 bg-[#C7F76F]/[.035] px-4">
      {bars.map((height, index) => (
        <motion.span
          key={`${height}-${index}`}
          className="w-2 rounded-full bg-gradient-to-t from-[#94C759] to-[#D8FF9B]"
          animate={{ height: [`${height * 0.55}%`, `${height}%`, `${height * 0.7}%`] }}
          transition={{ duration: 1.3 + index * 0.03, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
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
                  <p className="text-[11px] text-[#94836A]">Handled in a calm, human voice</p>
                </div>
              </div>
              <GlowPill>Live</GlowPill>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/[.07] bg-white/[.035] p-3.5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-[#94836A]">Caller</p>
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
                    <p className="mt-1 text-[11px] leading-5 text-[#B7AB98]">{item.text}</p>
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

function StoryPanel({ section, index }: { section: (typeof storySections)[number]; index: number }) {
  return (
    <section id={section.id} className="relative z-10 mx-auto flex min-h-[78svh] max-w-[1180px] items-center px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.62, ease: "easeOut" }}
        className="w-full"
      >
        <Card className="relative overflow-hidden p-6 sm:p-9 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(199,247,111,.08),transparent_34%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_.55fr] lg:items-center">
            <div>
              <GlowPill>{section.eyebrow}</GlowPill>
              <h2 className="mt-6 max-w-3xl text-4xl font-semibold leading-[.95] tracking-[-.06em] text-white sm:text-6xl">
                {section.title}
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#B7AB98] sm:text-lg">{section.text}</p>
            </div>
            <div className="rounded-[2rem] border border-white/[.07] bg-[#15110C]/70 p-6">
              <div className="flex items-center justify-between">
                <IconBox icon={section.icon} tone={section.tone} />
                <span className="text-[52px] font-black tracking-[-.08em] text-white/[.05]">0{index + 1}</span>
              </div>
              <p className="mt-10 text-5xl font-semibold tracking-[-.065em] text-white">{section.metric}</p>
              <p className="mt-3 text-[12px] font-black uppercase leading-5 tracking-[.16em] text-[#94836A]">{section.metricLabel}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}

function WaitlistCard() {
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const update = (key: keyof WaitlistForm) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "landing" }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok === false) throw new Error(data?.error || "Could not join waitlist");
      setStatus("success");
      setMessage("You're on the Bellory waitlist. We will reach out when onboarding spots open.");
      setForm(defaultForm);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Try again.");
    }
  };

  return (
    <div id="waitlist" className="scroll-mt-10">
    <Card className="relative overflow-hidden p-5 sm:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(199,247,111,.11),transparent_34%)]" />
      <form onSubmit={submit} className="relative">
        <SectionTitle title="Join the first Bellory installs" eyebrow="Private waitlist" action={<IconBox icon={Sparkles} tone="honey" />} />
        <p className="mb-5 text-[13px] leading-6 text-[#B7AB98]">Tell us where missed calls are costing you money. We are prioritizing service businesses with real inbound call volume.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94836A]">Name</p><Input value={form.name} onChange={update("name")} placeholder="Your name" /></div>
          <div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94836A]">Email</p><Input value={form.email} onChange={update("email")} placeholder="you@company.com" type="email" /></div>
          <div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94836A]">Company</p><Input value={form.company} onChange={update("company")} placeholder="Business name" /></div>
          <div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94836A]">Phone</p><Input value={form.phone} onChange={update("phone")} placeholder="Best number" /></div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94836A]">Business type</p>
            <Select value={form.businessType} onChange={update("businessType")}>{businessTypes.map((item) => <option key={item}>{item}</option>)}</Select>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94836A]">Call volume</p>
            <Select value={form.callVolume} onChange={update("callVolume")}>{callVolumes.map((item) => <option key={item}>{item}</option>)}</Select>
          </div>
        </div>
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94836A]">What are calls costing you?</p>
          <textarea
            value={form.message}
            onChange={(event) => update("message")(event.target.value)}
            rows={4}
            placeholder="Example: We miss after-hours emergency calls, spend too much time on price shoppers, and need calls booked into Google Calendar."
            className="w-full rounded-2xl border border-white/[.08] bg-[#15110C]/70 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-[#94836A] focus:border-[#C7F76F]/40"
          />
        </div>
        <Button disabled={status === "saving"} type="submit" className="mt-5 w-full">
          {status === "saving" ? "Joining..." : "Join the waitlist"} <ArrowRight size={14} />
        </Button>
        {message && <p className={status === "error" ? "mt-3 text-[12px] text-[#F08B72]" : "mt-3 text-[12px] text-[#C7F76F]"}>{message}</p>}
      </form>
    </Card>
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="landing-page min-h-screen overflow-hidden text-[#FFF7E8]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-18rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[#C7F76F]/10 blur-3xl" />
        <div className="absolute bottom-[-18rem] right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[#F6C66A]/10 blur-3xl" />
        <div className="grid-glow absolute inset-x-0 top-0 h-[36rem] opacity-40" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3">
          <Image src="/brand/bellory-bell.png" alt="Bellory" width={46} height={46} className="drop-shadow-[0_12px_28px_rgba(199,247,111,.18)]" priority />
          <div>
            <p className="text-[20px] font-black tracking-[-.045em] text-white">Bellory<span className="text-[#C7F76F]">.</span></p>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#94836A]">AI receptionist</p>
          </div>
        </a>
        <nav className="hidden items-center gap-6 text-[12px] font-bold text-[#B7AB98] md:flex">
          <a href="#proof" className="hover:text-white">Proof</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="/admin" className="hover:text-white">Admin</a>
        </nav>
        <Button onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}>Get early access</Button>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-86px)] max-w-[1180px] flex-col justify-center px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mx-auto max-w-5xl text-center">
          <Badge><span className="pulse-ring size-1.5 rounded-full bg-[#C7F76F]" /> Human-sounding AI receptionist</Badge>
          <h1 className="text-balance mx-auto mt-4 max-w-5xl text-5xl font-semibold leading-[.9] tracking-[-.075em] text-white sm:text-7xl lg:text-[5.7rem]">
            Turn missed calls into booked jobs.
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#B7AB98]">
            Bellory answers the phone like a calm front desk person, asks the right questions, books from real availability, and knows when to hand the call to a human.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} className="px-5 py-3 text-sm">Join the waitlist <ArrowRight size={15} /></Button>
            <Button kind="secondary" onClick={() => document.getElementById("proof")?.scrollIntoView({ behavior: "smooth" })} className="px-5 py-3 text-sm">See how it works</Button>
          </div>
        </motion.div>

        <HumanCallCard />
      </section>

      {storySections.map((section, index) => <StoryPanel key={section.id} section={section} index={index} />)}

      <section className="relative z-10 mx-auto grid max-w-[1180px] gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[.82fr_1.18fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <div className="self-start"><Badge><Star size={12} /> Private launch</Badge></div>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-.055em] text-white sm:text-6xl">Want Bellory to answer your phones?</h2>
          <p className="mt-5 max-w-xl text-[15px] leading-8 text-[#B7AB98]">We are opening installs in small batches so every business gets configured correctly: voice, phone, pricing, calendar, fallbacks, and launch QA.</p>
          <div className="mt-8 grid gap-3">
            {["Human-sounding receptionist", "Calendar-aware booking", "Custom business rules", "Human fallback routing"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[13px] font-bold text-[#FFF7E8]"><Check size={15} className="text-[#C7F76F]" /> {item}</div>
            ))}
          </div>
        </div>
        <WaitlistCard />
      </section>

      <footer className="relative z-10 border-t border-white/[.06] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 text-[12px] text-[#94836A] md:flex-row md:items-center md:justify-between">
          <p>Bellory AI - custom AI receptionists for businesses that cannot afford to miss the phone.</p>
          <div className="flex gap-4">
            <a href="/admin" className="font-bold text-[#C7F76F]">Admin console</a>
            <a href="#waitlist" className="font-bold text-[#FFF7E8]">Join waitlist</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
