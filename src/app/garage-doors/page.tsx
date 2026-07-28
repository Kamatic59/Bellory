import type { Metadata } from "next";
import { InfoCard, MarketingPage, PageSection } from "@/components/marketing-page";
import { demoPhoneDisplay, demoPhoneHref } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "For garage door companies",
  description: "Bellory is built for garage door calls: broken springs, off-track doors, trapped vehicles, opener failures — qualified, booked, and escalated by your rules.",
  alternates: { canonical: "/garage-doors" },
};

const scenarios = [
  ["Broken spring", "Callers describe a door that won't budge or a loud bang. Bellory checks whether a vehicle is trapped, treats it accordingly, and books the repair with the urgency your rules assign."],
  ["Door off track", "Off-track doors get flagged as a safety issue: Bellory tells the caller to leave the door alone, collects details, and gets the job scheduled or escalated."],
  ["Vehicle trapped inside", "The classic 7am emergency. Bellory classifies it as urgent on its own, finds the soonest real opening, and alerts you immediately."],
  ["Opener failures", "Remote not pairing, motor humming, keypad dead — qualified as service calls with the right appointment length, not guessed at."],
  ["New door estimates", "Estimate requests are captured with the details that matter — door size, material interest, timeline — and booked as estimate appointments."],
  ["Price shoppers", "Bellory quotes only the ranges you approve, never a hard number you didn't set, and turns shoppers into booked diagnostics when they're serious."],
] as const;

export default function GarageDoorsPage() {
  return (
    <MarketingPage
      eyebrow="Built for garage doors"
      title={<>It already speaks garage door.</>}
      lede="Bellory isn't a general-purpose answering bot with your name pasted in. Its call flows, urgency rules, and booking logic were built for garage door work from the first install — because that's the only industry we serve right now."
    >
      <PageSection>
        <h2 className="font-display text-3xl tracking-[-.02em] text-[#F3F1E6] sm:text-4xl">The calls it handles</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map(([title, text]) => (
            <InfoCard key={title} title={title}>{text}</InfoCard>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-[18px] p-6 sm:p-8">
            <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.2em] text-[#FF7A1A]">Emergency vs. routine</p>
            <h2 className="font-display mt-3 text-2xl tracking-[-.02em] text-[#F3F1E6] sm:text-3xl">Your urgency rules, enforced</h2>
            <p className="mt-4 text-[14.5px] leading-7 text-[#99978C]">
              You decide what counts as an emergency — trapped vehicles, stuck-open doors at night, commercial doors blocking a business — and what waits for morning. Bellory classifies every call against those rules, books the urgent ones into your soonest real opening, and texts the details forward so nobody finds out tomorrow.
            </p>
          </div>
          <div className="glass rounded-[18px] p-6 sm:p-8">
            <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.2em] text-[#8FD14F]">Service area</p>
            <h2 className="font-display mt-3 text-2xl tracking-[-.02em] text-[#F3F1E6] sm:text-3xl">No more wasted windshield time</h2>
            <p className="mt-4 text-[14.5px] leading-7 text-[#99978C]">
              Bellory checks the caller&rsquo;s city or ZIP against your coverage before promising anything. In-area callers get booked; out-of-area callers get a polite answer and their details saved for your review — not a 40-minute drive you didn&rsquo;t want.
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection>
        <div className="rounded-[18px] border border-[#C6F23D]/20 bg-[#C6F23D]/[.04] p-6 sm:p-8">
          <h2 className="font-display text-3xl tracking-[-.02em] text-[#F3F1E6]">Don&rsquo;t take our word for it.</h2>
          <p className="mt-3 max-w-[650px] text-[15px] leading-7 text-[#99978C]">
            The demo line answers as Wasatch Garage Door, a demo company running Bellory end to end. Tell it a spring snapped and your car is trapped. Ask what a new opener runs. Try to trip it up.
          </p>
          <a href={demoPhoneHref} className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#C6F23D] px-6 py-3.5 text-sm font-bold text-[#12120E] transition hover:bg-[#D3FA5A] active:translate-y-px">
            Call {demoPhoneDisplay} — answers 24/7
          </a>
        </div>
      </PageSection>
    </MarketingPage>
  );
}
