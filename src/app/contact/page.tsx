import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { contactEmail, contactEmailHref, demoPhoneDisplay, demoPhoneHref } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Bellory about a private garage door AI receptionist install.",
};

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact"
      title="Contact Bellory"
      description="Email us, hear Bellory live on the demo line, or request an install review and we'll call you back directly — Bellory is run by the two people who built it."
    >
      <LegalSection title="Email us">
        <p>Questions about installs, pricing, or anything else — email us and one of the two of us replies personally.</p>
        <p>
          <a href={contactEmailHref} className="font-bold text-[#C6F23D]">{contactEmail}</a>
        </p>
      </LegalSection>
      <LegalSection title="Hear Bellory live — 24/7">
        <p>
          The fastest way to understand Bellory is to call it. The demo line answers as Wasatch Garage Door, a demo company running Bellory end to end. Ask about pricing, coverage, or book a test appointment — no form, no signup.
        </p>
        <p>
          <a href={demoPhoneHref} className="font-bold text-[#C6F23D]">{demoPhoneDisplay}</a>
        </p>
      </LegalSection>
      <LegalSection title="Private installs and demos">
        <p>Use the request form to tell us where your garage door company serves, how many calls you miss, what booking system you use, and what you want Bellory to handle first. We follow up personally to set up a 15-minute fit call.</p>
        <p>
          <Link href="/#waitlist" className="font-bold text-[#C6F23D]">Request private install</Link>
        </p>
      </LegalSection>
      <LegalSection title="Existing setup conversations">
        <p>If you are already in a Bellory setup process, use the direct contact method shared during onboarding so urgent configuration changes do not get missed — or email <a href={contactEmailHref} className="font-bold text-[#C6F23D]">{contactEmail}</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
