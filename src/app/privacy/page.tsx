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
      description="How Bellory handles information from install requests, phone calls we answer, and text message confirmations."
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
      <LegalSection title="Text messages and your mobile number">
        <p>
          If you book an appointment by phone with a Bellory receptionist, you may be asked whether you
          would like a text confirmation. A text is sent only if you say yes. Agreeing is never a condition
          of booking the appointment or of receiving service.
        </p>
        <p>
          <strong className="text-white">
            We do not share, sell, or rent your mobile phone number or your SMS opt-in and consent data to
            third parties or affiliates for marketing or promotional purposes.
          </strong>{" "}
          Mobile numbers collected for appointment confirmations are used for that purpose and for reaching
          you about the job you booked.
        </p>
        <p>
          Message frequency varies, and is typically one to three messages per appointment. Message and data
          rates may apply. Reply STOP at any time to stop receiving messages, or HELP for help. Opting out of
          texts does not cancel your appointment.
        </p>
        <p>
          The exact wording our receptionist uses to ask for your consent is published at{" "}
          <a href="/sms-consent" className="font-bold text-[#C6F23D]">usebellory.com/sms-consent</a>, and the
          full messaging program terms are at{" "}
          <a href="/sms-terms" className="font-bold text-[#C6F23D]">usebellory.com/sms-terms</a>.
        </p>
      </LegalSection>
      <LegalSection title="Call recording">
        <p>
          Calls answered by Bellory may be recorded and transcribed so the business can review what was said
          and so we can improve the service. Consent requirements differ by state, and each business sets its
          own recording and disclosure rules during setup. If you would prefer not to be recorded, say so on
          the call and ask to be transferred to a person.
        </p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>
          For privacy questions, email <a href={contactEmailHref} className="font-bold text-[#C6F23D]">{contactEmail}</a>, use the contact page, or include the request in your Bellory private install submission.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
