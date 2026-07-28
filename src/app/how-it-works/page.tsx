import type { Metadata } from "next";
import { InfoCard, MarketingPage, PageSection, StepRow } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "How it works",
  description: "How a Bellory install goes from first conversation to answering your phone: configuration, call routing, testing, and ongoing human support.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <MarketingPage
      eyebrow="How it works"
      title={<>We do the setup. Your phone does the rest.</>}
      lede="Bellory is not software you configure. It's a receptionist we build around your business — your services, your prices, your rules — then test with you before it ever answers a real customer."
    >
      <PageSection>
        <h2 className="font-display text-3xl tracking-[-.02em] text-[#F3F1E6] sm:text-4xl">The install, step by step</h2>
        <div className="mt-6 border-t border-[#303228]">
          <StepRow num="01" title="A 15-minute fit call">
            You tell us how calls work today: who answers, what slips through, which jobs matter most. If Bellory isn&rsquo;t a fit, we say so and part friends.
          </StepRow>
          <StepRow num="02" title="We build your call flow">
            Services, pricing guidance, service area, business hours, emergency rules, booking logic, and who to contact when a human is needed. You answer questions — we do the configuration.
          </StepRow>
          <StepRow num="03" title="Your greeting, your rules">
            The receptionist gets a name, a greeting in your company&rsquo;s voice, and hard rules: what it may quote, what it must never promise, and when it hands the call to you.
          </StepRow>
          <StepRow num="04" title="Calendar connection">
            We connect your Google Calendar so booked jobs land where your crew already looks. Prefer to confirm every job yourself? Bellory can hold requests for your approval instead.
          </StepRow>
          <StepRow num="05" title="Test calls before launch">
            We call it together and try to break it: broken spring at 2am, out-of-area caller, price shopper, full calendar. It goes live only after the test scenarios pass.
          </StepRow>
          <StepRow num="06" title="Go live — without changing your number">
            Your existing number forwards to Bellory when you can&rsquo;t answer, or it runs on a dedicated line. Customers notice nothing except that someone always picks up.
          </StepRow>
        </div>
      </PageSection>

      <PageSection>
        <h2 className="font-display text-3xl tracking-[-.02em] text-[#F3F1E6] sm:text-4xl">On every call</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard title="Qualifies the caller">
            Name, callback number, address, and the actual problem — collected naturally, one question at a time, never like a form being read out loud.
          </InfoCard>
          <InfoCard title="Spots emergencies">
            Trapped vehicles, stuck-open doors, and safety issues are classified against your rules and treated with the urgency they deserve.
          </InfoCard>
          <InfoCard title="Checks your real availability">
            Openings come from your live calendar. Bellory never invents a time slot, and it respects travel buffers and appointment lengths you set.
          </InfoCard>
          <InfoCard title="Books or escalates">
            Qualified callers get booked by your rules. Anything outside the rules — pricing edge cases, unusual jobs, upset customers — goes to a person.
          </InfoCard>
          <InfoCard title="Hands off to humans">
            When a caller needs you, Bellory transfers the call to the owner&rsquo;s line and says so naturally. No dead ends, no &ldquo;please visit our website.&rdquo;
          </InfoCard>
          <InfoCard title="Keeps a record">
            Every call produces a transcript, a summary, and a saved lead — so the follow-up never depends on someone&rsquo;s memory.
          </InfoCard>
        </div>
      </PageSection>

      <PageSection>
        <div className="glass rounded-[18px] p-6 sm:p-8">
          <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.2em] text-[#8FD14F]">After launch</p>
          <h2 className="font-display mt-3 text-3xl tracking-[-.02em] text-[#F3F1E6]">You never manage the AI.</h2>
          <p className="mt-4 max-w-[650px] text-[15px] leading-7 text-[#99978C]">
            Want the greeting changed, a price range updated, or a new service added? Tell us and we handle it — usually the same day. Bellory is supported by the people who built it, not a ticket queue. And if something ever needs your attention, you hear about it instead of finding out later.
          </p>
        </div>
      </PageSection>
    </MarketingPage>
  );
}
