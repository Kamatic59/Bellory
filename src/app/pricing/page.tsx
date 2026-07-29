import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { InfoCard, MarketingPage, PageSection } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Pricing",
  description: "One plan with the first month free. Free installation, no contract, human support included. If month one doesn't book you jobs, you pay nothing.",
  alternates: { canonical: "/pricing" },
};

const setupIncludes = [
  "Call flow built around your business with you",
  "Greeting, services, and approved pricing language",
  "Service-area and business-hours rules",
  "Emergency classification and escalation rules",
  "Google Calendar connection and booking logic",
  "Test calls with you before anything goes live",
];

const monthlyIncludes = [
  "24/7 answering on your existing number",
  "Caller qualification and lead capture",
  "Booking straight to your calendar, by your rules",
  "Urgent-call transfer to the owner",
  "Call transcripts and summaries",
  "Rule changes handled for you by the builders",
];

export default function PricingPage() {
  return (
    <MarketingPage
      eyebrow="Pricing"
      title={<>One plan. No contract. Month one is free.</>}
      lede="Bellory runs on one flat monthly rate — about the cost of one small repair job, settled together after your free month. Installation is free, there's no contract, and if the first month doesn't book you work you would have missed, you pay nothing and we take it off your line."
    >
      <PageSection>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-[18px] p-6 sm:p-8">
            <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.2em] text-[#8FD14F]">Included in setup — free</p>
            <ul className="mt-5 space-y-3">
              {setupIncludes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14.5px] leading-6 text-[#D8D5CA]">
                  <Check size={15} className="mt-1 shrink-0 text-[#8FD14F]" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-[18px] p-6 sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.2em] text-[#8FD14F]">Monthly service</p>
              <p className="text-xl font-bold tracking-[-.02em] text-white">One flat rate</p>
            </div>
            <ul className="mt-5 space-y-3">
              {monthlyIncludes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14.5px] leading-6 text-[#D8D5CA]">
                  <Check size={15} className="mt-1 shrink-0 text-[#8FD14F]" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PageSection>

      <PageSection>
        <h2 className="font-display text-3xl tracking-[-.02em] text-[#F3F1E6] sm:text-4xl">The fine print, in plain English</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard title="The first-month assurance">
            Month one is judged on your calendar, not our word. No jobs you would otherwise have missed? You owe nothing — ever — and we remove Bellory from your line.
          </InfoCard>
          <InfoCard title="Usage limits">
            Typical garage-door call volumes are fully covered by the flat price. If your line is unusually heavy, we&rsquo;ll talk about it with you first — you will never see a surprise bill.
          </InfoCard>
          <InfoCard title="Cancellation">
            Month to month after the free month. Cancel with a message to the builders; forwarding turns off and your phone works exactly as it did before.
          </InfoCard>
          <InfoCard title="Your number stays yours">
            Bellory answers via call forwarding or a dedicated line. Your published number never changes and you can turn forwarding off at any time.
          </InfoCard>
          <InfoCard title="Human support">
            Support is the two people who built Bellory. Config changes, new services, pricing updates — send a text and it&rsquo;s usually handled the same day.
          </InfoCard>
          <InfoCard title="Early installs">
            The first shops in each area help us test and shape the product — and keep preferential pricing after launch as thanks.
          </InfoCard>
        </div>
        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row">
          <Link href="/#waitlist" className="inline-flex items-center justify-center rounded-xl bg-[#C6F23D] px-6 py-3.5 text-sm font-bold text-[#12120E] transition hover:bg-[#D3FA5A] active:translate-y-px">
            Start my free month
          </Link>
        </div>
      </PageSection>
    </MarketingPage>
  );
}
