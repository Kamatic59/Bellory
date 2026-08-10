"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  Download,
  FlaskConical,
  MessageSquareText,
  PhoneCall,
  PhoneOutgoing,
  Plus,
  Trophy,
} from "lucide-react";
import type { ConsoleSession } from "@/lib/session-api";
import {
  createProspect,
  importUtahProspects,
  listDials,
  listProspects,
  logDial,
  updateProspect,
  type DialOutcome,
  type ProspectStatus,
  type SalesDial,
  type SalesProspect,
} from "@/lib/sales-api";
import { Badge, Button, Card, IconBox, Input, Modal, Progress, SectionTitle, Select } from "./ui";

// The plan numbers from the break-even map — starting guesses, shown next to
// measured rates so the funnel recalibrates itself as real dials land.
const PLAN = {
  conversationRate: 0.25,
  demoRate: 0.4,
  pilotRate: 0.5,
  payRate: 0.6,
  profitPerClient: 250,
  fixedCosts: 160,
  goalClients: 25,
  dialsPerClient: 33,
};

const CALLER_STORAGE_KEY = "bellory-sales-caller";

const conversationOutcomes: DialOutcome[] = ["conversation", "demo_committed", "pilot_agreed", "became_paying", "not_fit"];

const outcomeButtons: Array<{ outcome: DialOutcome; label: string; tone: "muted" | "blue" | "honey" | "mint" | "coral" }> = [
  { outcome: "no_answer", label: "No answer", tone: "muted" },
  { outcome: "voicemail", label: "Voicemail", tone: "muted" },
  { outcome: "gatekeeper", label: "Gatekeeper", tone: "muted" },
  { outcome: "conversation", label: "Conversation", tone: "blue" },
  { outcome: "demo_committed", label: "Demo committed", tone: "honey" },
  { outcome: "pilot_agreed", label: "Pilot agreed", tone: "mint" },
  { outcome: "became_paying", label: "Became paying", tone: "mint" },
  { outcome: "not_fit", label: "Not a fit", tone: "coral" },
];

const statusMeta: Record<ProspectStatus, { label: string; tone: "mint" | "honey" | "coral" | "blue" | "muted" }> = {
  untouched: { label: "Untouched", tone: "muted" },
  working: { label: "Working", tone: "blue" },
  demo_sent: { label: "Demo sent", tone: "honey" },
  pilot: { label: "Pilot", tone: "mint" },
  paying: { label: "Paying", tone: "mint" },
  not_fit: { label: "Not a fit", tone: "coral" },
};

const statusOrder: Record<ProspectStatus, number> = { untouched: 0, working: 1, demo_sent: 2, pilot: 3, paying: 4, not_fit: 5 };

const tierMeta: Record<number, { label: string; hint: string }> = {
  1: { label: "Tier 1 — owner-run shops", hint: "They ARE the phone line. Call these first." },
  2: { label: "Tier 2 — the 24/7 promisers", hint: "The 2 am pitch: give the owner their nights back." },
  3: { label: "Tier 3 — big fish", hint: "Overflow pitch only. Call last." },
  4: { label: "Spotted — number needed", hint: "Grab the number off Google before dialing." },
};

function telHref(display: string) {
  const digits = display.replace(/\D/g, "");
  return `tel:+1${digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits}`;
}

function daysAgo(iso: string | null, now: number) {
  if (!iso || !now) return null;
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function isDue(prospect: SalesProspect, now: number) {
  if (!prospect.nextActionAt || !now) return false;
  const due = new Date(prospect.nextActionAt);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  return due <= endOfToday && prospect.status !== "not_fit" && prospect.status !== "paying";
}

function StatTile({
  icon,
  tone,
  label,
  value,
  detail,
}: {
  icon: typeof PhoneOutgoing;
  tone: "mint" | "honey" | "coral" | "blue" | "violet";
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <IconBox icon={icon} tone={tone} />
        <div className="min-w-0">
          <p className="font-mono-ui text-[9px] font-semibold uppercase tracking-[.18em] text-[#99978C]">{label}</p>
          <p className="mt-1 text-[22px] font-bold leading-7 tracking-[-.02em] text-white">{value}</p>
          {detail && <p className="mt-0.5 truncate text-[11px] text-[#99978C]">{detail}</p>}
        </div>
      </div>
    </Card>
  );
}

function FunnelRow({ label, count, rate, planRate, base }: { label: string; count: number; rate: number | null; planRate: number; base: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[.06] bg-white/[.02] px-3.5 py-2.5">
      <span className="text-[12.5px] font-semibold text-[#D8D5CA]">{label}</span>
      <span className="font-mono-ui flex items-center gap-3 text-[11px]">
        <span className="text-white">{count}</span>
        <span className={clsx(rate === null ? "text-[#706F66]" : rate >= planRate ? "text-[#8FD14F]" : "text-[#F0837B]")}>
          {rate === null ? "—" : `${Math.round(rate * 100)}%`}
        </span>
        <span className="text-[#706F66]">plan {Math.round(planRate * 100)}% of {base}</span>
      </span>
    </div>
  );
}

export function SalesPage({ session }: { session?: ConsoleSession | null }) {
  const [prospects, setProspects] = useState<SalesProspect[]>([]);
  const [dials, setDials] = useState<SalesDial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [storedCaller, setStoredCaller] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  // Dials are credited to whoever is signed in. The typed name is only a
  // fallback for old sign-ins that predate per-person logins.
  const caller = session?.username ?? storedCaller;
  const isCaller = session?.role === "caller";

  useEffect(() => {
    queueMicrotask(() => {
      setStoredCaller(window.localStorage.getItem(CALLER_STORAGE_KEY) ?? "");
    });
  }, []);

  const saveCaller = (value: string) => {
    setStoredCaller(value);
    window.localStorage.setItem(CALLER_STORAGE_KEY, value);
  };

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [nextProspects, nextDials] = await Promise.all([listProspects(), listDials()]);
      setProspects(nextProspects);
      setDials(nextDials);
      setNow(Date.now());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load the sales board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const stats = useMemo(() => {
    const weekMs = 7 * 86_400_000;
    const dialsThisWeek = now === 0 ? [] : dials.filter((dial) => now - new Date(dial.createdAt).getTime() < weekMs);
    const conversationsThisWeek = dialsThisWeek.filter((dial) => conversationOutcomes.includes(dial.outcome));

    const byCaller = new Map<string, number>();
    for (const dial of dialsThisWeek) {
      const key = dial.caller?.trim() || "unattributed";
      byCaller.set(key, (byCaller.get(key) ?? 0) + 1);
    }
    const callerLine = [...byCaller.entries()].map(([who, count]) => `${who}: ${count}`).join(" · ");

    const dialedProspects = prospects.filter((prospect) => prospect.dialCount > 0);
    const prospectDialOutcomes = new Map<string, Set<DialOutcome>>();
    for (const dial of dials) {
      const set = prospectDialOutcomes.get(dial.prospectId) ?? new Set<DialOutcome>();
      set.add(dial.outcome);
      prospectDialOutcomes.set(dial.prospectId, set);
    }
    const conversationProspects = prospects.filter((prospect) => {
      const outcomes = prospectDialOutcomes.get(prospect.id);
      const talked = outcomes ? conversationOutcomes.some((outcome) => outcomes.has(outcome)) : false;
      return talked || statusOrder[prospect.status] >= 2;
    });
    const demoProspects = prospects.filter((prospect) => ["demo_sent", "pilot", "paying"].includes(prospect.status));
    const pilotProspects = prospects.filter((prospect) => ["pilot", "paying"].includes(prospect.status));
    const payingProspects = prospects.filter((prospect) => prospect.status === "paying");

    const paying = payingProspects.length;
    const profit = Math.max(0, paying * PLAN.profitPerClient - (paying > 0 ? PLAN.fixedCosts : 0));

    // A caller's own numbers, so the scoreboard is about their day.
    const mine = caller.trim().toLowerCase();
    const isMine = (dial: SalesDial) => Boolean(mine) && (dial.caller ?? "").trim().toLowerCase() === mine;
    const startOfToday = now === 0 ? 0 : new Date(new Date(now).setHours(0, 0, 0, 0)).getTime();
    const myDialsThisWeek = dialsThisWeek.filter(isMine);

    return {
      totalDials: dials.length,
      dialsThisWeek: dialsThisWeek.length,
      conversationsThisWeek: conversationsThisWeek.length,
      myDialsThisWeek: myDialsThisWeek.length,
      myDialsToday: myDialsThisWeek.filter((dial) => new Date(dial.createdAt).getTime() >= startOfToday).length,
      myConversationsThisWeek: myDialsThisWeek.filter((dial) => conversationOutcomes.includes(dial.outcome)).length,
      untouched: prospects.filter((prospect) => prospect.status === "untouched").length,
      callerLine,
      dialed: dialedProspects.length,
      conversations: conversationProspects.length,
      demos: demoProspects.length,
      pilots: pilotProspects.length,
      pilotsRunning: pilotProspects.length - paying,
      paying,
      profit,
      dueCallbacks: prospects.filter((prospect) => isDue(prospect, now)),
    };
  }, [dials, prospects, now, caller]);

  const groups = useMemo(() => {
    const sorted = [...prospects].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.company.localeCompare(b.company);
    });
    return [1, 2, 3, 4]
      .map((tier) => ({ tier, items: sorted.filter((prospect) => prospect.tier === tier) }))
      .filter((group) => group.items.length > 0);
  }, [prospects]);

  const showFlash = (message: string) => {
    setFlash(message);
    window.setTimeout(() => setFlash(null), 2600);
  };

  const handleImport = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await importUtahProspects();
      showFlash(`Utah list imported — ${result.inserted} added${result.skipped ? `, ${result.skipped} already present` : ""}.`);
      await refresh();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const handleLogDial = async (prospect: SalesProspect, outcome: DialOutcome, note: string, callbackDate: string) => {
    setBusy(true);
    setError(null);
    try {
      await logDial({
        prospectId: prospect.id,
        outcome,
        caller: caller.trim() || undefined,
        note: note.trim() || undefined,
        nextActionAt: callbackDate ? new Date(`${callbackDate}T09:00:00`).toISOString() : undefined,
      });
      showFlash(`Logged ${outcomeButtons.find((button) => button.outcome === outcome)?.label.toLowerCase()} for ${prospect.company}.`);
      await refresh();
    } catch (logError) {
      setError(logError instanceof Error ? logError.message : "Could not log the dial");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNotes = async (prospect: SalesProspect, notes: string) => {
    setBusy(true);
    try {
      await updateProspect(prospect.id, { notes: notes.trim() || null });
      showFlash(`Notes saved for ${prospect.company}.`);
      await refresh();
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : "Could not save notes");
    } finally {
      setBusy(false);
    }
  };

  const handleClearCallback = async (prospect: SalesProspect) => {
    setBusy(true);
    try {
      await updateProspect(prospect.id, { nextActionAt: null });
      await refresh();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Could not clear the callback");
    } finally {
      setBusy(false);
    }
  };

  const goalProgress = Math.min(100, (stats.paying / PLAN.goalClients) * 100);

  return (
    <div className="space-y-6">
      {isCaller && (
        <>
          <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-4 sm:p-5">
            <h2 className="text-[16px] font-bold tracking-[-.015em] text-white">Hi {session?.username}. Here&rsquo;s the job.</h2>
            <p className="mt-1.5 text-[13px] leading-6 text-[#99978C]">
              Work down the call sheet below, starting at the top. Tap a company to open it, tap the green phone button to
              call, then tap one button to say how it went. That&rsquo;s the whole job.
            </p>
          </div>
          <CallScript name={caller} defaultOpen />
        </>
      )}

      {/* scoreboard */}
      <div>
        <SectionTitle
          eyebrow="The Friday whiteboard"
          title="Scoreboard"
          action={
            <div className="flex items-center gap-2">
              <span className="font-mono-ui hidden text-[9px] font-semibold uppercase tracking-[.18em] text-[#706F66] sm:block">Dialing as</span>
              {session ? (
                <span className="rounded-lg border border-[#C6F23D]/20 bg-[#C6F23D]/[.07] px-3 py-2 text-[12px] font-bold text-[#D3FA5A]">
                  {session.username}
                </span>
              ) : (
                <Input value={storedCaller} onChange={saveCaller} placeholder="Your name" ariaLabel="Who is dialing" className="w-[120px] px-3 py-2 text-[12px]" />
              )}
            </div>
          }
        />
        <div className={clsx("grid gap-3", isCaller ? "grid-cols-3" : "grid-cols-2 xl:grid-cols-4")}>
          <StatTile
            icon={PhoneOutgoing}
            tone="mint"
            label={isCaller ? "Your calls · last 7 days" : "Dials · last 7 days"}
            value={String(isCaller ? stats.myDialsThisWeek : stats.dialsThisWeek)}
            detail={isCaller ? `${stats.myDialsToday} today` : stats.callerLine || `${stats.totalDials} all-time`}
          />
          <StatTile
            icon={MessageSquareText}
            tone="blue"
            label={isCaller ? "Owners you reached" : "Conversations · last 7 days"}
            value={String(isCaller ? stats.myConversationsThisWeek : stats.conversationsThisWeek)}
            detail={isCaller ? "last 7 days" : `${stats.conversations} owners reached all-time`}
          />
          <StatTile
            icon={FlaskConical}
            tone="honey"
            label={isCaller ? "Left to call" : "Pilots running"}
            value={String(isCaller ? stats.untouched : stats.pilotsRunning)}
            detail={isCaller ? "shops nobody has called yet" : `${stats.demos} shops past the demo stage`}
          />
          {!isCaller && (
            <StatTile
              icon={Trophy}
              tone="violet"
              label={`Paying clients / ${PLAN.goalClients}`}
              value={String(stats.paying)}
              detail={stats.paying > 0 ? `$${stats.profit.toLocaleString()}/mo profit · $${Math.floor(stats.profit / 2).toLocaleString()} each` : "client #1 pays all the bills"}
            />
          )}
        </div>
        {!isCaller && (
          <div className="mt-3">
            <Progress value={goalProgress} tone={stats.paying >= PLAN.goalClients ? "mint" : "honey"} />
            <p className="font-mono-ui mt-1.5 text-[10px] uppercase tracking-[.14em] text-[#706F66]">
              {stats.paying >= PLAN.goalClients ? "Freedom number hit — keep climbing to 33 for after-tax." : `${PLAN.goalClients - stats.paying} clients to the freedom number`}
            </p>
          </div>
        )}
      </div>

      {/* funnel */}
      <Card className={clsx("p-4 sm:p-5", isCaller && "hidden")}>
        <SectionTitle eyebrow="Recalibrates as real dials land" title="Funnel — measured vs plan" />
        <div className="grid gap-2 lg:grid-cols-2">
          <FunnelRow label="Dials (all-time)" count={stats.totalDials} rate={null} planRate={1} base="—" />
          <FunnelRow label="Owner conversations" count={stats.conversations} rate={stats.totalDials > 0 ? stats.conversations / stats.totalDials : null} planRate={PLAN.conversationRate} base="dials" />
          <FunnelRow label="Past the demo" count={stats.demos} rate={stats.conversations > 0 ? stats.demos / stats.conversations : null} planRate={PLAN.demoRate} base="convos" />
          <FunnelRow label="Pilots (incl. converted)" count={stats.pilots} rate={stats.demos > 0 ? stats.pilots / stats.demos : null} planRate={PLAN.pilotRate} base="demos" />
          <FunnelRow label="Paying" count={stats.paying} rate={stats.pilots > 0 ? stats.paying / stats.pilots : null} planRate={PLAN.payRate} base="pilots" />
        </div>
        <p className="mt-3 text-[11px] leading-5 text-[#99978C]">
          Plan math: ~{PLAN.dialsPerClient} dials per paying client
          {stats.paying > 0 && stats.totalDials > 0 ? ` · measured: ${Math.round(stats.totalDials / stats.paying)} dials per client` : ""}. Every dial ≈ ${(PLAN.profitPerClient / PLAN.dialsPerClient).toFixed(2)}/mo of recurring profit.
        </p>
      </Card>

      {!isCaller && <CallScript name={caller} defaultOpen={false} />}

      {flash && (
        <div aria-live="polite" className="rounded-xl border border-[#C6F23D]/25 bg-[#C6F23D]/[.07] px-4 py-3 text-[13px] font-semibold text-[#D3FA5A]">
          {flash}
        </div>
      )}
      {error && (
        <div aria-live="polite" className="flex items-center justify-between gap-3 rounded-xl border border-[#E95A50]/25 bg-[#E95A50]/[.08] px-4 py-3 text-[13px] text-[#F0837B]">
          <span className="min-w-0 break-words">{error}</span>
          <Button kind="secondary" onClick={() => { setLoading(true); void refresh(); }} className="shrink-0 px-3 py-1.5 text-[12px]">
            Try again
          </Button>
        </div>
      )}

      {/* due callbacks */}
      {stats.dueCallbacks.length > 0 && (
        <Card className="border border-[#FF7A1A]/[.18] p-4 sm:p-5">
          <SectionTitle eyebrow="Promised — keep it" title={`Call back today (${stats.dueCallbacks.length})`} />
          <div className="space-y-2">
            {stats.dueCallbacks.map((prospect) => (
              <ProspectRow
                key={`due-${prospect.id}`}
                prospect={prospect}
                now={now}
                expanded={expandedId === `due-${prospect.id}`}
                onToggle={() => setExpandedId(expandedId === `due-${prospect.id}` ? null : `due-${prospect.id}`)}
                onLogDial={handleLogDial}
                onSaveNotes={handleSaveNotes}
                onClearCallback={handleClearCallback}
                busy={busy}
                highlight
              />
            ))}
          </div>
        </Card>
      )}

      {/* call sheet */}
      <div>
        <SectionTitle
          eyebrow={`${prospects.length} prospects · work tier 1 first`}
          title="Call sheet"
          action={
            <div className="flex gap-2">
              {!isCaller && (
                <Button kind="secondary" onClick={handleImport} disabled={busy} className="px-3 py-2 text-[12px]">
                  <Download size={13} /> <span className="hidden sm:inline">Import Utah list</span><span className="sm:hidden">Import</span>
                </Button>
              )}
              <Button onClick={() => setAddOpen(true)} className="px-3 py-2 text-[12px]">

                <Plus size={13} /> <span className="hidden sm:inline">Add prospect</span><span className="sm:hidden">Add</span>
              </Button>
            </div>
          }
        />

        {loading && <Card className="p-8 text-center text-[13px] text-[#99978C]">Loading the call sheet…</Card>}

        {!loading && prospects.length === 0 && !error && (
          <Card className="p-8 text-center">
            <p className="text-[14px] font-semibold text-white">The call sheet is empty.</p>
            <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-6 text-[#99978C]">
              Import the 26-company Utah prospect list from the field guide — tiers, phone numbers, research, and angles included — and start dialing.
            </p>
            <Button onClick={handleImport} disabled={busy} className="mt-4">
              <Download size={14} /> Import the Utah list
            </Button>
          </Card>
        )}

        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.tier}>
              <div className="mb-2 flex items-baseline gap-3">
                <h3 className="text-[13px] font-bold tracking-[-.01em] text-white">{tierMeta[group.tier].label}</h3>
                <span className="font-mono-ui hidden text-[9px] uppercase tracking-[.16em] text-[#706F66] sm:block">{tierMeta[group.tier].hint}</span>
              </div>
              <div className="space-y-2">
                {group.items.map((prospect) => (
                  <ProspectRow
                    key={prospect.id}
                    prospect={prospect}
                    now={now}
                    expanded={expandedId === prospect.id}
                    onToggle={() => setExpandedId(expandedId === prospect.id ? null : prospect.id)}
                    onLogDial={handleLogDial}
                    onSaveNotes={handleSaveNotes}
                    onClearCallback={handleClearCallback}
                    busy={busy}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddProspectModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        busy={busy}
        onCreate={async (payload) => {
          setBusy(true);
          setError(null);
          try {
            await createProspect(payload);
            setAddOpen(false);
            showFlash(`${payload.company} added to the sheet.`);
            await refresh();
          } catch (createError) {
            setError(createError instanceof Error ? createError.message : "Could not add the prospect");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

const SCRIPT_OPENER = [
  "Hey, is the owner around?",
  "My name's {name} — I'll be quick. My partner and I built an AI receptionist for garage door shops. It answers the phone when you can't, quotes the job, and books it on your calendar.",
  "Before we charge anybody, we're looking for a couple of Utah shops to run it free and tell us what needs fixing. Any interest in trying it?",
];

const SCRIPT_ANSWERS: Array<{ they: string; you: string }> = [
  {
    they: "Not interested.",
    you: "Totally fair. Can I text you the number so you can hear it yourself? Takes about a minute, and if you hate it you never hear from me again.",
  },
  {
    they: "How much is it?",
    you: "Free while you're testing it. After that it's one flat monthly rate, less than a single small repair job. Nobody pays until it's actually booking work.",
  },
  {
    they: "We already have someone answering the phone.",
    you: "Perfect, this isn't for them. It's for after they go home. What happens right now when someone calls at 9pm with a broken spring?",
  },
  {
    they: "I'm busy / I'm on a job.",
    you: "I hear you. Can I text you a number you can call whenever you've got a minute? That's the whole ask.",
  },
  {
    they: "Is this a robot? / Is it AI?",
    you: "It is, and it says so if anyone asks. That's why I want you to call it first and judge it yourself before we ever put it on your line.",
  },
  {
    they: "(Receptionist) He's not available.",
    you: "No worries at all. Can I text him a number he can call to hear it himself? Then he can decide if it's worth a conversation.",
  },
];

/**
 * The whole job on one card: what to say, what to say back, and the one move
 * that ends every call that isn't a yes.
 */
function CallScript({ name, defaultOpen }: { name: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const speaker = name.trim() || "your name";

  return (
    <Card className="p-4 sm:p-5">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span>
          <span className="block text-[14px] font-bold tracking-[-.01em] text-white">What to say on the call</span>
          <span className="mt-0.5 block text-[12px] text-[#99978C]">Read it word for word until it feels natural. It works.</span>
        </span>
        <ChevronDown size={16} className={clsx("shrink-0 text-[#99978C] transition-transform", open && "rotate-180 text-[#C6F23D]")} />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-[#C6F23D]/[.16] bg-[#C6F23D]/[.04] p-3.5">
            <p className="font-mono-ui mb-2 text-[9px] font-semibold uppercase tracking-[.18em] text-[#8FD14F]">Step 1 — open with this</p>
            <div className="space-y-2">
              {SCRIPT_OPENER.map((line) => (
                <p key={line} className="text-[13px] leading-6 text-[#D8D5CA]">
                  {line.replace("{name}", speaker)}
                </p>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono-ui mb-2 text-[9px] font-semibold uppercase tracking-[.18em] text-[#99978C]">Step 2 — if they push back</p>
            <div className="space-y-2">
              {SCRIPT_ANSWERS.map((item) => (
                <div key={item.they} className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">
                  <p className="text-[12px] font-semibold text-[#F0837B]">They say: {item.they}</p>
                  <p className="mt-1 text-[12.5px] leading-6 text-[#D8D5CA]">You say: {item.you}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#FF7A1A]/[.18] bg-[#FF7A1A]/[.04] p-3.5">
            <p className="font-mono-ui mb-2 text-[9px] font-semibold uppercase tracking-[.18em] text-[#FF9448]">Step 3 — always end with this</p>
            <p className="text-[13px] leading-6 text-[#D8D5CA]">
              If it isn&rsquo;t a yes, get permission to text them the demo line:{" "}
              <span className="font-mono-ui font-bold text-white">(385) 340-1808</span>. It answers like a real garage door shop, so
              they can hear it without talking to you. A &ldquo;yes, text me&rdquo; counts — tap <strong className="text-white">Demo committed</strong> when you log the call.
            </p>
          </div>

          <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3.5">
            <p className="font-mono-ui mb-2 text-[9px] font-semibold uppercase tracking-[.18em] text-[#99978C]">Two rules</p>
            <p className="text-[12.5px] leading-6 text-[#99978C]">
              1. Never call <span className="font-mono-ui text-[#D8D5CA]">(385) 340-1808</span>{" "}as a prospect — that&rsquo;s our own demo line.
              <br />
              2. Log every single call, even &ldquo;no answer.&rdquo; That&rsquo;s how you get paid and how we know what&rsquo;s working.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function ProspectRow({
  prospect,
  now,
  expanded,
  onToggle,
  onLogDial,
  onSaveNotes,
  onClearCallback,
  busy,
  highlight = false,
}: {
  prospect: SalesProspect;
  now: number;
  expanded: boolean;
  onToggle: () => void;
  onLogDial: (prospect: SalesProspect, outcome: DialOutcome, note: string, callbackDate: string) => Promise<void>;
  onSaveNotes: (prospect: SalesProspect, notes: string) => Promise<void>;
  onClearCallback: (prospect: SalesProspect) => Promise<void>;
  busy: boolean;
  highlight?: boolean;
}) {
  const [note, setNote] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [notesDraft, setNotesDraft] = useState(prospect.notes ?? "");
  const meta = statusMeta[prospect.status];
  const last = daysAgo(prospect.lastDialAt, now);
  const due = isDue(prospect, now);

  const submitDial = async (outcome: DialOutcome) => {
    await onLogDial(prospect, outcome, note, callbackDate);
    setNote("");
    setCallbackDate("");
  };

  return (
    <div className={clsx("rounded-2xl border transition-colors", highlight || due ? "border-[#FF7A1A]/[.22] bg-[#FF7A1A]/[.03]" : "border-white/[.07] bg-white/[.02]", expanded && "border-[#C6F23D]/25")}>
      <div className="flex items-center gap-3 p-3 sm:px-4">
        <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={expanded}>
          <ChevronDown size={14} className={clsx("shrink-0 text-[#99978C] transition-transform", expanded && "rotate-180 text-[#C6F23D]")} />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold tracking-[-.01em] text-white">{prospect.company}</span>
            <span className="font-mono-ui mt-0.5 block truncate text-[10px] uppercase tracking-[.1em] text-[#99978C]">
              {prospect.area ?? "—"}
              {prospect.dialCount > 0 && ` · ${prospect.dialCount} dial${prospect.dialCount === 1 ? "" : "s"}`}
              {last && ` · last ${last}`}
              {due && " · CALLBACK DUE"}
            </span>
          </span>
        </button>
        <Badge tone={meta.tone}>{meta.label}</Badge>
        {prospect.phone ? (
          <a
            href={telHref(prospect.phone)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#C6F23D] px-3 py-2.5 text-[12px] font-bold text-[#12120E] transition hover:bg-[#D3FA5A]"
          >
            <PhoneCall size={13} /> <span className="hidden md:inline">{prospect.phone}</span><span className="md:hidden">Call</span>
          </a>
        ) : (
          <Badge tone="coral">No number</Badge>
        )}
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-white/[.06] p-4">
          {(prospect.research || prospect.angle) && (
            <div className="grid gap-3 lg:grid-cols-2">
              {prospect.research && (
                <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">
                  <p className="font-mono-ui mb-1 text-[9px] font-semibold uppercase tracking-[.18em] text-[#99978C]">What we know</p>
                  <p className="text-[12.5px] leading-6 text-[#99978C]">{prospect.research}</p>
                </div>
              )}
              {prospect.angle && (
                <div className="rounded-xl border border-[#C6F23D]/[.14] bg-[#C6F23D]/[.03] p-3">
                  <p className="font-mono-ui mb-1 text-[9px] font-semibold uppercase tracking-[.18em] text-[#8FD14F]">Your angle</p>
                  <p className="text-[12.5px] leading-6 text-[#D8D5CA]">{prospect.angle}</p>
                </div>
              )}
            </div>
          )}

          {prospect.altPhones.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {prospect.altPhones.map((alt) => (
                <a key={alt.phone} href={telHref(alt.phone)} className="font-mono-ui inline-flex items-center gap-1.5 rounded-lg border border-white/[.09] bg-white/[.03] px-2.5 py-1.5 text-[11px] text-[#D8D5CA] transition hover:border-[#C6F23D]/30">
                  <PhoneCall size={11} className="text-[#8FD14F]" /> {alt.label}: {alt.phone}
                </a>
              ))}
            </div>
          )}

          <div>
            <p className="font-mono-ui mb-2 text-[9px] font-semibold uppercase tracking-[.18em] text-[#99978C]">Log this dial</p>
            <div className="flex flex-wrap gap-1.5">
              {outcomeButtons.map((button) => (
                <button
                  key={button.outcome}
                  disabled={busy}
                  onClick={() => void submitDial(button.outcome)}
                  className={clsx(
                    "rounded-lg border px-2.5 py-2 text-[11.5px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                    {
                      muted: "border-white/[.09] bg-white/[.03] text-[#99978C] hover:border-white/[.18] hover:text-white",
                      blue: "border-[#99978C]/25 bg-[#99978C]/[.08] text-[#D8D5CA] hover:border-[#99978C]/45",
                      honey: "border-[#FF7A1A]/25 bg-[#FF7A1A]/[.08] text-[#FF9448] hover:border-[#FF7A1A]/45",
                      mint: "border-[#C6F23D]/25 bg-[#C6F23D]/[.08] text-[#D3FA5A] hover:border-[#C6F23D]/45",
                      coral: "border-[#E95A50]/25 bg-[#E95A50]/[.08] text-[#F0837B] hover:border-[#E95A50]/45",
                    }[button.tone],
                  )}
                >
                  {button.label}
                </button>
              ))}
            </div>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input value={note} onChange={setNote} placeholder="Optional note — who you talked to, what they said…" ariaLabel="Dial note" className="px-3 py-2.5 text-[12.5px]" />
              <div className="flex items-center gap-2">
                <CalendarClock size={14} className="shrink-0 text-[#99978C]" />
                <Input type="date" value={callbackDate} onChange={setCallbackDate} ariaLabel="Callback date" className="w-[150px] px-3 py-2.5 text-[12.5px]" />
              </div>
            </div>
            <p className="font-mono-ui mt-1.5 text-[9px] uppercase tracking-[.14em] text-[#706F66]">Note + callback date attach to the outcome you tap.</p>
          </div>

          <div>
            <p className="font-mono-ui mb-2 text-[9px] font-semibold uppercase tracking-[.18em] text-[#99978C]">Running notes</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input value={notesDraft} onChange={setNotesDraft} placeholder="Anything worth remembering next dial…" ariaLabel="Prospect notes" className="px-3 py-2.5 text-[12.5px]" />
              <Button kind="secondary" disabled={busy || notesDraft === (prospect.notes ?? "")} onClick={() => void onSaveNotes(prospect, notesDraft)} className="px-3 py-2 text-[12px]">
                Save
              </Button>
            </div>
          </div>

          {prospect.nextActionAt && (
            <div className="flex items-center justify-between rounded-xl border border-[#FF7A1A]/[.16] bg-[#FF7A1A]/[.04] px-3.5 py-2.5">
              <span className="text-[12px] text-[#FF9448]">
                Callback {new Date(prospect.nextActionAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <Button kind="ghost" disabled={busy} onClick={() => void onClearCallback(prospect)} className="px-2 py-1 text-[11px]">
                Clear
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddProspectModal({
  open,
  onClose,
  onCreate,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { company: string; phone?: string; area?: string; tier?: number; research?: string; angle?: string }) => Promise<void>;
  busy: boolean;
}) {
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [tier, setTier] = useState("1");
  const [research, setResearch] = useState("");
  const [angle, setAngle] = useState("");

  const submit = async () => {
    if (!company.trim()) return;
    await onCreate({
      company: company.trim(),
      phone: phone.trim() || undefined,
      area: area.trim() || undefined,
      tier: Number(tier),
      research: research.trim() || undefined,
      angle: angle.trim() || undefined,
    });
    setCompany("");
    setPhone("");
    setArea("");
    setTier("1");
    setResearch("");
    setAngle("");
  };

  return (
    <Modal open={open} title="Add a prospect" onClose={onClose}>
      <div className="space-y-3">
        <Input value={company} onChange={setCompany} placeholder="Company name" ariaLabel="Company name" required />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={phone} onChange={setPhone} placeholder="Phone — (801) 555-0100" ariaLabel="Phone" type="tel" />
          <Input value={area} onChange={setArea} placeholder="Area — e.g. Provo · Utah County" ariaLabel="Area" />
        </div>
        <Select
          value={tier}
          onChange={setTier}
          ariaLabel="Tier"
          options={[
            { value: "1", label: "Tier 1 — owner-run shop", description: "They are the phone line. Call first." },
            { value: "2", label: "Tier 2 — advertises 24/7", description: "The 2 am pitch." },
            { value: "3", label: "Tier 3 — big fish", description: "Overflow pitch only." },
            { value: "4", label: "Spotted", description: "Still need the number." },
          ]}
        />
        <Input value={research} onChange={setResearch} placeholder="What we know (hours, owner, reviews…)" ariaLabel="Research" />
        <Input value={angle} onChange={setAngle} placeholder="Your angle — the opener that fits this shop" ariaLabel="Angle" />
        <div className="flex justify-end gap-2 pt-1">
          <Button kind="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={busy || !company.trim()}>
            <Plus size={14} /> Add to sheet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
