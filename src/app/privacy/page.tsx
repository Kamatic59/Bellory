import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { contactEmail, contactEmailHref } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Bellory handles private install and business setup information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="This launch policy explains what Bellory collects from private garage door install requests and future business setup conversations."
    >
      <LegalSection title="Information we collect">
        <p>When you request a private install, we collect the information you submit, such as your name, work email, phone number, business name, service area, missed-call estimate, advertising status, booking system, and setup notes.</p>
        <p>We also collect basic technical details such as browser user agent and referrer so we can protect the form from abuse and understand where requests come from.</p>
      </LegalSection>
      <LegalSection title="How we use it">
        <p>We use this information to review private install fit, contact you about Bellory, prepare onboarding, and improve the landing page and setup process.</p>
        <p>We do not sell private install submissions.</p>
      </LegalSection>
      <LegalSection title="Phone calls and customer details">
        <p>Bellory is designed for phone answering, scheduling, summaries, and fallback routing. Before any production launch, each business setup should define call recording, consent, retention, and escalation rules that fit the business and location.</p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>
          For privacy questions, email <a href={contactEmailHref} className="font-bold text-[#C7F76F]">{contactEmail}</a>, use the contact page, or include the request in your Bellory private install submission.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
