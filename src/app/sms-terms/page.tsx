import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "SMS Terms",
  description: "Terms for the Bellory appointment confirmation text messaging program.",
};

/**
 * Carrier vetting reads this page directly. Every element below is required by
 * the A2P 10DLC campaign review: program name, what the messages are, message
 * frequency, a customer care contact, opt-out instructions, and the message and
 * data rates disclosure. Removing any one of them is a rejection.
 */
export default function SmsTermsPage() {
  return (
    <LegalPage
      eyebrow="Messaging"
      title="SMS Terms"
      description="Terms for the Bellory appointment confirmation messaging program."
    >
      <LegalSection title="The program">
        <p>
          The program is called <strong className="text-white">Bellory</strong>. Bellory is an AI receptionist
          that answers the phone for local home service businesses, such as garage door repair shops, and books
          appointments on their behalf.
        </p>
        <p>
          If you book an appointment on one of those calls, we can send you a text confirming the day, the
          arrival window, and the address, along with reminders about that appointment and messages about
          scheduling it. These are transactional messages about a job you asked us to book. We do not send
          marketing or promotional texts through this program.
        </p>
      </LegalSection>

      <LegalSection title="How you join">
        <p>
          You join by saying yes on the phone. During a call, the receptionist asks whether you would like a
          text confirmation and reads out the terms before sending anything. A text is sent only if you
          affirmatively agree.
        </p>
        <p>
          Consent is never a condition of booking your appointment or of receiving service. If you decline,
          you still get your appointment.
        </p>
        <p>
          The exact script the receptionist reads is published at{" "}
          <a href="/sms-consent" className="font-bold text-[#C6F23D]">usebellory.com/sms-consent</a>.
        </p>
      </LegalSection>

      <LegalSection title="Message frequency and cost">
        <p>
          Message frequency varies. Expect roughly one to three messages per appointment you book.
        </p>
        <p>
          <strong className="text-white">Message and data rates may apply.</strong> Bellory does not charge you
          for these messages, but your mobile carrier may, depending on your plan.
        </p>
      </LegalSection>

      <LegalSection title="How to stop">
        <p>
          Reply <strong className="text-white">STOP</strong> to any message to stop receiving texts. You will
          get one confirmation that you have been unsubscribed, and then nothing further.
        </p>
        <p>
          Stopping texts does not cancel your appointment. If you want to change or cancel the job, call the
          business back.
        </p>
        <p>
          Reply <strong className="text-white">HELP</strong> to any message for help, or contact us using the
          details below.
        </p>
      </LegalSection>

      <LegalSection title="Carriers and delivery">
        <p>
          Carriers are not liable for delayed or undelivered messages. Delivery is not guaranteed, and message
          delivery depends on your carrier and your device.
        </p>
      </LegalSection>

      <LegalSection title="Privacy">
        <p>
          We do not share, sell, or rent your mobile phone number or your SMS opt-in and consent data to third
          parties or affiliates for marketing or promotional purposes. See our{" "}
          <a href="/privacy" className="font-bold text-[#C6F23D]">Privacy Policy</a> for the full detail.
        </p>
      </LegalSection>

      <LegalSection title="Customer care">
        <p>
          Bellory LLC
          <br />
          Email: <a href="mailto:kael@usebellory.com" className="font-bold text-[#C6F23D]">kael@usebellory.com</a>
          <br />
          Phone: <a href="tel:+13852805021" className="font-bold text-[#C6F23D]">(385) 280-5021</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
