import type { ReactNode } from "react";
import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { SiteFooter, SiteNav } from "./site-chrome";
import { demoPhoneDisplay, demoPhoneHref } from "@/lib/config/site";

/** Shared shell for secondary marketing pages. */
export function MarketingPage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede: string;
  children: ReactNode;
}) {
  return (
    <div className="grain relative min-h-screen text-[#F3F1E6]">
      <SiteNav />
      <main id="main" className="relative z-10">
        <header className="mx-auto max-w-[1180px] px-5 pb-4 pt-14 sm:px-8 sm:pt-20">
          <p className="font-mono-ui text-[11px] font-semibold uppercase tracking-[.22em] text-[#8FD14F]">{eyebrow}</p>
          <h1 className="font-display mt-4 max-w-3xl text-balance text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.02] tracking-[-.02em] text-[#F3F1E6]">
            {title}
          </h1>
          <p className="mt-6 max-w-[650px] text-base leading-7 text-[#99978C] sm:text-lg sm:leading-8">{lede}</p>
        </header>
        {children}
      </main>
      <CtaBand />
      <SiteFooter />
    </div>
  );
}

export function PageSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16 ${className}`}>{children}</section>;
}

export function CtaBand() {
  return (
    <section className="relative z-10 border-t border-[#303228] bg-[#171812]">
      <div className="mx-auto flex max-w-[1180px] flex-col items-start gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-3xl leading-[1.05] tracking-[-.02em] text-[#F3F1E6] sm:text-4xl">
            Your next missed call could have been a booked job.
          </h2>
          <p className="mt-3 max-w-[560px] text-[15px] leading-7 text-[#99978C]">
            Free installation, no contract, and month one costs nothing if Bellory doesn&rsquo;t book you work you would have missed.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/#waitlist"
            className="inline-flex items-center justify-center rounded-xl bg-[#C6F23D] px-6 py-3.5 text-sm font-bold text-[#12120E] transition hover:bg-[#D3FA5A] active:translate-y-px"
          >
            Start my free month
          </Link>
          <a
            href={demoPhoneHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#45483A] bg-[#1C1E17] px-6 py-3.5 text-sm font-bold text-[#F3F1E6] transition hover:border-[#C6F23D]/40 active:translate-y-px"
          >
            <PhoneCall size={15} /> {demoPhoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="glass h-full rounded-[16px] p-6">
      <p className="text-[16px] font-bold tracking-[-.01em] text-[#F3F1E6]">{title}</p>
      <div className="mt-2.5 text-[14px] leading-6 text-[#99978C]">{children}</div>
    </div>
  );
}

export function StepRow({ num, title, children }: { num: string; title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-[#303228] py-6 sm:grid-cols-[72px_240px_1fr] sm:gap-6">
      <span className="font-mono-ui text-[12px] font-semibold text-[#8FD14F]">{num}</span>
      <p className="text-[16px] font-bold tracking-[-.01em] text-[#F3F1E6]">{title}</p>
      <div className="max-w-[650px] text-[14.5px] leading-7 text-[#99978C]">{children}</div>
    </div>
  );
}
