import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Bellory about a private garage door AI receptionist install.",
};

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact"
      title="Contact Bellory"
      description="The fastest way to reach Bellory during private garage door installs is to request an install review from the landing page."
    >
      <LegalSection title="Private installs and demos">
        <p>Use the request form to tell us where your garage door company serves, how many calls you miss, what booking system you use, and what you want Bellory to handle first.</p>
        <p>
          <Link href="/#waitlist" className="font-bold text-[#C7F76F]">Request private install</Link>
        </p>
      </LegalSection>
      <LegalSection title="Existing setup conversations">
        <p>If you are already in a Bellory setup process, use the direct contact method shared during onboarding so urgent configuration changes do not get missed.</p>
      </LegalSection>
    </LegalPage>
  );
}
