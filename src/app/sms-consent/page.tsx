import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "SMS Consent",
  description: "The exact script Bellory reads before sending any text message, plus a sample call.",
};

/**
 * This page is the opt-in evidence URL submitted with the A2P 10DLC campaign.
 *
 * Verbal consent is the highest-rejection-rate opt-in type there is, because a
 * reviewer cannot see a checkbox being ticked. Twilio's guidance is explicit
 * that a verbal flow needs the exact agent script with every disclosure, hosted
 * somewhere publicly reachable. That is what this page exists for, so the
 * wording below has to stay identical to what the agent actually says on a
 * call. If the prompt changes, change this page in the same commit.
 */

const SCRIPT = `Would you like me to text you a confirmation of this appointment? You would get about one to three messages per appointment from Bellory on behalf of NAME OF THE BUSINESS. Message and data rates may apply, and message frequency varies. You can reply STOP any time to opt out, or HELP for help. We will not share your number with anyone for marketing. The terms are at usebellory dot com slash sms terms, and the privacy policy is at usebellory dot com slash privacy.`;

export default function SmsConsentPage() {
  return (
    <LegalPage
      eyebrow="Messaging"
      title="How we ask before we text you"
      description="Bellory only texts people who said yes out loud on a phone call. This page shows the exact words used to ask."
    >
      <LegalSection title="When consent is collected">
        <p>
          Consent is collected verbally, during an inbound phone call that the caller placed. Callers dial a
          local home service business, such as a garage door repair shop, and speak with Bellory, an AI
          receptionist operated by Bellory LLC on that business&rsquo;s behalf.
        </p>
        <p>
          Bellory never calls people who have not called first, and never texts anyone who has not verbally
          agreed on such a call. There is no web form, no purchased list, and no imported contacts.
        </p>
      </LegalSection>

      <LegalSection title="The exact script">
        <p>
          After the caller has agreed to an appointment time, and only then, the receptionist reads this,
          substituting the name of the business it is answering for:
        </p>
        <blockquote className="rounded-[14px] border border-white/[.09] bg-[#171812]/70 p-5 text-[#F3F1E6]">
          <p className="italic leading-7">&ldquo;{SCRIPT}&rdquo;</p>
        </blockquote>
        <p>
          A text is sent only if the caller affirmatively says yes. Silence, a change of subject, or anything
          ambiguous is treated as a no.
        </p>
      </LegalSection>

      <LegalSection title="Consent is never required">
        <p>
          Agreeing to texts is not a condition of booking the appointment, and not a condition of receiving
          service. Callers who decline get exactly the same appointment, at the same time, at the same price.
        </p>
      </LegalSection>

      <LegalSection title="A sample call">
        <p>An abbreviated transcript of how this sounds in practice:</p>
        <div className="space-y-2 rounded-[14px] border border-white/[.09] bg-[#171812]/70 p-5 font-mono-ui text-[13px] leading-6">
          <p><span className="text-[#8FD14F]">Caller:</span> <span className="text-[#D8D5CA]">My spring snapped and my car is stuck in the garage.</span></p>
          <p><span className="text-[#C6F23D]">Bellory:</span> <span className="text-[#D8D5CA]">That is a rough one. Where are you located?</span></p>
          <p><span className="text-[#8FD14F]">Caller:</span> <span className="text-[#D8D5CA]">Sandy.</span></p>
          <p><span className="text-[#C6F23D]">Bellory:</span> <span className="text-[#D8D5CA]">We cover Sandy. Soonest I have is today between three and five. Does that work?</span></p>
          <p><span className="text-[#8FD14F]">Caller:</span> <span className="text-[#D8D5CA]">Yes, that works.</span></p>
          <p><span className="text-[#C6F23D]">Bellory:</span> <span className="text-[#D8D5CA]">{SCRIPT}</span></p>
          <p><span className="text-[#8FD14F]">Caller:</span> <span className="text-[#D8D5CA]">Yeah, go ahead.</span></p>
          <p><span className="text-[#C6F23D]">Bellory:</span> <span className="text-[#D8D5CA]">Done. You are set for today between three and five.</span></p>
        </div>
      </LegalSection>

      <LegalSection title="What we keep as proof">
        <p>
          Every call is recorded and transcribed, and each consent is timestamped against the phone number it
          came from. If there is ever a question about whether someone agreed, the recording and transcript
          answer it.
        </p>
      </LegalSection>

      <LegalSection title="Stopping messages">
        <p>
          Reply <strong className="text-white">STOP</strong> to any message and the texts stop immediately.
          Reply <strong className="text-white">HELP</strong> for help. Stopping texts never cancels an
          appointment.
        </p>
        <p>
          Full program terms are at{" "}
          <a href="/sms-terms" className="font-bold text-[#C6F23D]">usebellory.com/sms-terms</a>, and our{" "}
          <a href="/privacy" className="font-bold text-[#C6F23D]">Privacy Policy</a> covers how the number
          itself is handled.
        </p>
      </LegalSection>

      <LegalSection title="Questions">
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
