"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  Check,
  Clock3,
  Headphones,
  LineChart,
  LockKeyhole,
  MessageSquareText,
  PhoneCall,
  PhoneForwarded,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Card, IconBox, Input, Progress, SectionTitle, Select } from "./ui";

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

const proofCards = [
  { icon: PhoneCall, value: "1.8s", label: "answer target", helper: "Calls are picked up before most customers decide to keep dialing." },
  { icon: CalendarCheck, value: "24/7", label: "booking window", helper: "After-hours callers can still be qualified, scheduled, and followed up." },
  { icon: BadgeDollarSign, value: "$7k+", label: "example leakage", helper: "What 20 missed $350 jobs can cost a busy service business each month." },
] as const;

const flow = [
  { title: "Answers like your front desk", text: "A human-sounding AI receptionist greets callers, understands urgency, and asks the right questions.", icon: Headphones },
  { title: "Books from real availability", text: "Bellory checks calendar rules, quote guardrails, service areas, and escalation paths before promising anything.", icon: CalendarCheck },
  { title: "Escalates the messy stuff", text: "Urgent, angry, low-confidence, or high-value calls are routed to a real person with a clean summary.", icon: PhoneForwarded },
] as const;

const heroOutcomes = [
  "Answers every call",
  "Books from live rules",
  "Escalates urgent jobs",
  "Shows saved revenue",
] as const;

const heroTimeline = [
  { icon: MessageSquareText, tone: "mint", title: "Understood caller", detail: "Water heater leak, same-day request, inside service area." },
  { icon: TriangleAlert, tone: "coral", title: "Flagged urgency", detail: "Active water issue qualifies for priority routing." },
  { icon: CalendarCheck, tone: "blue", title: "Held appointment", detail: "2:30 PM slot reserved under the shop's booking rules." },
  { icon: PhoneForwarded, tone: "honey", title: "Prepared fallback", detail: "Owner transfer ready if caller asks for a human." },
] as const;

const businessTypes = ["Home services", "Dental / medical office", "Legal office", "Real estate", "Wellness / salon", "Other"];
const callVolumes = ["Under 50 calls/month", "50-150 calls/month", "150-500 calls/month", "500+ calls/month"];

function GlowPill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[#C7F76F]/20 bg-[#C7F76F]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.16em] text-[#D8FF9B]">{children}</span>;
}

function VisualMetric({ icon: Icon, label, value, tone = "mint" }: { icon: LucideIcon; label: string; value: string; tone?: "mint" | "honey" | "coral" | "blue" }) {
  return (
    <div className="rounded-2xl border border-white/[.07] bg-white/[.035] p-4">
      <div className="mb-4 flex items-center justify-between">
        <IconBox icon={Icon} tone={tone} />
        <span className="text-[10px] font-bold text-[#94836A]">LIVE</span>
      </div>
      <p className="text-2xl font-semibold tracking-[-.04em] text-white">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[.12em] text-[#94836A]">{label}</p>
    </div>
  );
}

function Waveform() {
  const bars = useMemo(() => [28, 48, 34, 72, 42, 88, 53, 35, 66, 46, 80, 31, 58, 39, 71, 45], []);

  return (
    <div className="flex h-20 items-center gap-1.5 rounded-2xl border border-[#C7F76F]/10 bg-[#C7F76F]/[.035] px-4">
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

function HeroConsole() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, rotateX: 5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative lg:pl-2"
    >
      <div className="absolute -inset-6 rounded-[2.4rem] bg-[#C7F76F]/10 blur-3xl" />
      <div className="absolute right-6 top-8 hidden rounded-full border border-[#C7F76F]/20 bg-[#C7F76F]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-[#D8FF9B] shadow-[0_18px_60px_rgba(199,247,111,.12)] sm:block">
        Live call
      </div>
      <Card className="relative overflow-hidden p-3 sm:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_4%,rgba(199,247,111,.18),transparent_30%),radial-gradient(circle_at_10%_95%,rgba(246,198,106,.08),transparent_26%)]" />
        <div className="relative grid gap-4 rounded-[1.5rem] border border-white/[.07] bg-[#15110C]/78 p-4 shadow-[inset_0_1px_0_rgba(255,247,232,.035)] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#C7F76F]/10">
                <Image src="/brand/bellory-bell.png" alt="" width={38} height={38} className="drop-shadow-[0_10px_24px_rgba(199,247,111,.2)]" />
              </span>
              <div>
                <p className="text-[13px] font-black text-white">Bellory call desk</p>
                <p className="text-[11px] text-[#94836A]">Canyon Plumbing - after hours</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#C7F76F]/15 bg-[#C7F76F]/10 px-3 py-1.5 text-[11px] font-black text-[#D8FF9B]">
              <span className="pulse-ring size-1.5 rounded-full bg-[#C7F76F]" />
              Answering
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[.98fr_1.02fr]">
            <div className="grid gap-4">
              <div className="rounded-[1.25rem] border border-white/[.07] bg-white/[.035] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#C7F76F]">Caller says</p>
                  <span className="rounded-full bg-[#E05F45]/10 px-2.5 py-1 text-[10px] font-black text-[#F08B72]">Urgent</span>
                </div>
                <p className="text-[18px] font-semibold leading-7 tracking-[-.035em] text-white">
                  &quot;Hi, my water heater is leaking and I need someone today.&quot;
                </p>
                <p className="mt-3 text-[12px] leading-5 text-[#B7AB98]">
                  Bellory keeps the caller moving while checking service area, intake questions, calendar rules, and fallback logic.
                </p>
              </div>

              <Waveform />
            </div>

            <div className="rounded-[1.25rem] border border-[#C7F76F]/12 bg-[#C7F76F]/[.045] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#C7F76F]">Bellory response</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-.055em] text-white">2:30 PM hold created.</h2>
                </div>
                <IconBox icon={Activity} />
              </div>
              <div className="mt-4 grid gap-2">
                {["Collected issue details", "Confirmed customer is in service radius", "Sent owner summary by SMS"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-white/[.06] bg-[#15110C]/48 p-2.5 text-[12px] text-[#EDE0C8]">
                    <Check size={13} className="text-[#C7F76F]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {heroTimeline.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/[.07] bg-white/[.028] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <IconBox icon={item.icon} tone={item.tone} />
                  <p className="text-[13px] font-black text-white">{item.title}</p>
                </div>
                <p className="text-[11px] leading-5 text-[#B7AB98]">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <VisualMetric icon={TimerReset} label="admin time saved" value="8 min" />
            <VisualMetric icon={CalendarCheck} label="booking status" value="Held" tone="blue" />
            <VisualMetric icon={BadgeDollarSign} label="job value" value="$420" tone="honey" />
          </div>
        </div>
      </Card>
    </motion.div>
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

      <header className="relative z-10 mx-auto flex max-w-[1480px] items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
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

      <section className="relative z-10 mx-auto grid max-w-[1480px] gap-8 px-4 pb-12 pt-5 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8 lg:pb-16 lg:pt-10">
        <div className="flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <Badge><span className="pulse-ring size-1.5 rounded-full bg-[#C7F76F]" /> Live-call automation for service businesses</Badge>
            <h1 className="text-balance mt-5 max-w-4xl text-5xl font-semibold leading-[.9] tracking-[-.075em] text-white sm:text-7xl lg:text-[5.55rem]">
              Turn every call into booked revenue.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#B7AB98]">
              Bellory is a custom AI receptionist that answers instantly, qualifies callers, books from real calendar rules, and hands off urgent moments with context.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.55 }} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} className="px-5 py-3 text-sm">Join the waitlist <ArrowRight size={15} /></Button>
            <Button kind="secondary" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="px-5 py-3 text-sm">See the system</Button>
          </motion.div>
          <div className="mt-7 flex max-w-2xl flex-wrap gap-2">
            {heroOutcomes.map((item) => (
              <span key={item} className="rounded-full border border-white/[.07] bg-white/[.035] px-3 py-2 text-[11px] font-black uppercase tracking-[.12em] text-[#CFC1AA]">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-5 grid max-w-2xl gap-3 sm:grid-cols-3">
            {proofCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + index * 0.08, duration: 0.55 }} className="rounded-2xl border border-white/[.07] bg-white/[.035] p-4">
                  <Icon size={17} className="mb-4 text-[#C7F76F]" />
                  <p className="text-2xl font-semibold tracking-[-.04em] text-white">{card.value}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[.14em] text-[#94836A]">{card.label}</p>
                  <p className="mt-2 text-[11px] leading-5 text-[#B7AB98]">{card.helper}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <HeroConsole />
      </section>

      <section id="proof" className="relative z-10 mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <GlowPill>Why Bellory wins calls</GlowPill>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.05em] text-white sm:text-5xl">
              The best receptionist is the one that never lets revenue wait.
            </h2>
          </div>
          <p className="max-w-md text-[14px] leading-7 text-[#B7AB98]">
            Bellory is designed around the actual job: answer fast, qualify correctly, book safely, and prove the time and money saved.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Missed calls are silent churn", "A caller who reaches voicemail keeps dialing until somebody answers. Bellory catches them first.", TriangleAlert, "coral"],
            ["Reception work compounds", "Pricing questions, dispatch rules, intake details, and reminders burn owner time every day.", Clock3, "honey"],
            ["The AI needs guardrails", "Bellory is configured per business: service areas, quote rules, urgency triggers, and fallback people.", ShieldCheck, "mint"],
          ].map(([title, text, icon, tone]) => (
            <Card key={title as string} hover className="p-5">
              <IconBox icon={icon as LucideIcon} tone={tone as "mint" | "honey" | "coral"} />
              <h2 className="mt-5 text-2xl font-semibold tracking-[-.04em] text-white">{title as string}</h2>
              <p className="mt-3 text-[13px] leading-6 text-[#B7AB98]">{text as string}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="how" className="relative z-10 mx-auto max-w-[1480px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <GlowPill>How Bellory saves money</GlowPill>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.055em] text-white sm:text-6xl">A receptionist that knows the business, not just the script.</h2>
          </div>
          <p className="max-w-md text-[14px] leading-7 text-[#B7AB98]">Each client gets a custom operating brain: pricing guardrails, calendar rules, urgent triggers, owner fallbacks, and compliance language.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {flow.map((item, index) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: index * 0.08, duration: 0.55 }}>
              <Card hover className="h-full p-6">
                <div className="flex items-center justify-between">
                  <IconBox icon={item.icon} />
                  <span className="text-[42px] font-black tracking-[-.08em] text-white/[.05]">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-2xl font-semibold tracking-[-.04em] text-white">{item.title}</h3>
                <p className="mt-3 text-[13px] leading-6 text-[#B7AB98]">{item.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-[1480px] gap-5 px-4 py-14 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:px-8 lg:py-16">
        <Card className="p-6 sm:p-8">
          <SectionTitle title="The investor story is simple" eyebrow="Revenue recovered" action={<IconBox icon={LineChart} />} />
          <div className="space-y-5">
            {[
              ["20 missed calls", "After-hours, lunch breaks, busy dispatch windows."],
              ["$350 average job", "Conservative for many service categories."],
              ["$7,000 monthly leakage", "Before referrals, reviews, and repeat work."],
            ].map(([value, label], index) => (
              <div key={value} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-[#C7F76F]/10 text-[10px] font-black text-[#C7F76F]">{index + 1}</span>
                  <p className="text-xl font-semibold tracking-[-.04em] text-white">{value}</p>
                </div>
                <p className="text-[12px] leading-5 text-[#B7AB98]">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#C7F76F]">Operator console preview</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-.05em] text-white">Every client becomes configurable.</h2>
            </div>
            <IconBox icon={LockKeyhole} tone="blue" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Business brain", "Services, FAQs, service areas, tone."],
              ["AI voice", "Greeting, pace, interruptions, disclosure."],
              ["Calendar rules", "Direct booking, owner approval, lead-only."],
              ["Escalations", "Urgent triggers, transfer order, SMS summaries."],
              ["Compliance", "Recording consent, never-say rules, retention."],
              ["Proof", "Calls answered, jobs saved, hours saved."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/[.07] bg-[#15110C]/62 p-4">
                <div className="mb-3 flex items-center gap-2"><Zap size={13} className="text-[#C7F76F]" /><p className="text-[13px] font-black text-white">{title}</p></div>
                <p className="text-[11px] leading-5 text-[#B7AB98]">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#94836A]"><span>Client setup readiness</span><span className="text-[#C7F76F]">92%</span></div>
            <Progress value={92} />
          </div>
        </Card>
      </section>

      <section className="relative z-10 mx-auto grid max-w-[1480px] gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="self-start"><Badge><Star size={12} /> Private launch</Badge></div>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-.055em] text-white sm:text-6xl">Be first in line before the phone starts ringing.</h2>
          <p className="mt-5 max-w-xl text-[15px] leading-8 text-[#B7AB98]">We are opening Bellory in small batches so every business gets configured correctly: voice, phone, pricing, calendar, fallbacks, and launch QA.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Custom AI receptionist", "Realistic voice", "Calendar-aware booking", "Human fallback routing"].map((item) => (
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
