import type { Metadata } from "next";
import { MarketingPage, PageSection } from "@/components/marketing-page";
import { contactEmail, contactEmailHref, demoPhoneDisplay, demoPhoneHref } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Resources",
  description: "Guides for garage door companies on phones, missed calls, and booking — written from real Bellory installs.",
  alternates: { canonical: "/resources" },
};

const upcoming = [
  ["What a missed call actually costs a garage door company", "The honest math on ad spend, average tickets, and after-hours calls."],
  ["Forwarding, ports, and dedicated lines", "The three ways to route calls to a receptionist — and which one fits your shop."],
  ["Emergency call handling that doesn't over-promise", "How to define urgent for your business so nobody gets told 'tonight' when the truth is tomorrow."],
  ["The test-call checklist we run before every launch", "The scenarios we use to try to break an install before your customers can."],
] as const;

export default function ResourcesPage() {
  return (
    <MarketingPage
      eyebrow="Resources"
      title={<>Guides are being written from real installs.</>}
      lede="We'd rather publish nothing than publish filler. As Bellory installs teach us what garage door companies actually ask, the answers land here."
    >
      <PageSection>
        <div className="grid gap-4 sm:grid-cols-2">
          {upcoming.map(([title, text]) => (
            <div key={title} className="glass rounded-[16px] p-6">
              <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.18em] text-[#706F66]">Coming soon</p>
              <p className="mt-3 text-[16px] font-bold leading-6 tracking-[-.01em] text-[#F3F1E6]">{title}</p>
              <p className="mt-2 text-[13.5px] leading-6 text-[#99978C]">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-[16px] border border-[#303228] bg-[#171812] p-6">
          <p className="text-[15px] font-bold text-[#F3F1E6]">Have a question that should be answered here?</p>
          <p className="mt-2 max-w-[650px] text-[14px] leading-6 text-[#99978C]">
            Email <a href={contactEmailHref} className="font-semibold text-[#C6F23D] hover:text-[#D3FA5A]">{contactEmail}</a> and one of the two of us will answer it directly — and probably turn it into the next guide. Or skip reading entirely and hear the product yourself: <a href={demoPhoneHref} className="font-semibold text-[#C6F23D] hover:text-[#D3FA5A]">{demoPhoneDisplay}</a>.
          </p>
        </div>
      </PageSection>
    </MarketingPage>
  );
}
