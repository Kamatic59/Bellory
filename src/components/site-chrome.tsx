"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, PhoneCall, X } from "lucide-react";
import { BelloryLogo } from "./brand";
import { contactEmail, contactEmailHref, demoPhoneDisplay, demoPhoneHref } from "@/lib/config/site";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/garage-doors", label: "For garage doors" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
] as const;

export function SiteNav({ onCta }: { onCta?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock background scroll while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cta = onCta ? (
    <button
      onClick={() => { setOpen(false); onCta(); }}
      className="inline-flex items-center justify-center rounded-xl bg-[#C6F23D] px-4 py-2.5 text-[13px] font-bold text-[#12120E] transition hover:bg-[#D3FA5A] active:translate-y-px"
    >
      Start my free month
    </button>
  ) : (
    <Link
      href="/#waitlist"
      onClick={() => setOpen(false)}
      className="inline-flex items-center justify-center rounded-xl bg-[#C6F23D] px-4 py-2.5 text-[13px] font-bold text-[#12120E] transition hover:bg-[#D3FA5A] active:translate-y-px"
    >
      Start my free month
    </Link>
  );

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 transition-colors duration-200",
        scrolled ? "border-b border-[#303228] bg-[#171812]/95 backdrop-blur-sm" : "border-b border-transparent bg-transparent",
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#C6F23D] focus:px-4 focus:py-2 focus:text-[#12120E]">
        Skip to content
      </a>
      <div className="mx-auto flex h-[64px] max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Bellory home" className="shrink-0">
          <BelloryLogo className="text-[17px]" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "rounded-lg px-3 py-2 text-[13.5px] font-semibold tracking-[-.01em] transition-colors",
                pathname === link.href ? "text-[#C6F23D]" : "text-[#99978C] hover:text-[#F3F1E6]",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={demoPhoneHref} className="rounded-lg px-2 py-2 text-[13.5px] font-semibold text-[#99978C] transition-colors hover:text-[#F3F1E6]">
            Call the demo
          </a>
          {cta}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {cta}
          <button
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-11 place-items-center rounded-xl border border-[#303228] bg-[#1C1E17] text-[#F3F1E6]"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-b border-[#303228] bg-[#171812] lg:hidden">
          <nav aria-label="Mobile" className="mx-auto max-w-[1180px] space-y-1 px-5 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "block rounded-xl px-4 py-3.5 text-[15px] font-semibold",
                  pathname === link.href ? "bg-[#C6F23D]/[.08] text-[#C6F23D]" : "text-[#D8D5CA] hover:bg-white/[.04]",
                )}
              >
                {link.label}
              </Link>
            ))}
            <a href={demoPhoneHref} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-3.5 text-[15px] font-semibold text-[#D8D5CA] hover:bg-white/[.04]">
              <PhoneCall size={15} className="text-[#C6F23D]" /> Call the live demo — {demoPhoneDisplay}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/garage-doors", label: "For garage doors" },
      { href: "/pricing", label: "Pricing" },
      { href: demoPhoneHref, label: "Live demo line", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/resources", label: "Resources" },
      { href: "/contact", label: "Contact" },
      { href: contactEmailHref, label: contactEmail, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
      { href: "/sms-terms", label: "SMS terms" },
      { href: "/sms-consent", label: "SMS consent" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[#303228] bg-[#171812]">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_2fr]">
        <div>
          <BelloryLogo className="text-[16px]" />
          <p className="mt-4 max-w-xs text-[13.5px] leading-6 text-[#99978C]">
            A done-for-you AI receptionist for garage door companies. Bellory answers missed and after-hours calls, qualifies callers, and books jobs by your rules.
          </p>
          <a href={demoPhoneHref} className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#C6F23D] transition hover:text-[#D3FA5A]">
            <PhoneCall size={14} /> Hear it live: {demoPhoneDisplay}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="font-mono-ui mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#706F66]">{column.title}</p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a href={link.href} className="inline-flex items-center py-0.5 text-[13.5px] text-[#99978C] transition hover:text-[#F3F1E6]">{link.label}</a>
                    ) : (
                      <Link href={link.href} className="inline-flex items-center py-0.5 text-[13.5px] text-[#99978C] transition hover:text-[#F3F1E6]">{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[#303228]">
        <p className="mx-auto max-w-[1180px] px-5 py-5 text-[12px] text-[#706F66] sm:px-8">
          © {new Date().getFullYear()} Bellory. Built and supported by the two people who made it.
        </p>
      </div>
    </footer>
  );
}
