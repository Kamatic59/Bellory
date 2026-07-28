import type { Metadata } from "next";
import { InfoCard, MarketingPage, PageSection } from "@/components/marketing-page";
import { contactEmail, contactEmailHref } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "About",
  description: "Bellory is built and supported by the two people who made it — practical automation for small service businesses, with humans doing the setup and support.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="About"
      title={<>Two people, one job: answer the phone right.</>}
      lede="Bellory exists because small service businesses lose real jobs to voicemail every week — not for lack of skill, but because the person who fixes the door is also the person who answers the phone."
    >
      <PageSection>
        <div className="max-w-[650px] space-y-5 text-[15.5px] leading-8 text-[#D8D5CA]">
          <p>
            We started with garage door companies on purpose. The calls are urgent, the jobs are valuable, and the owner is usually twenty feet up a ladder when the phone rings. If a receptionist can earn its keep anywhere, it&rsquo;s here — and if it can&rsquo;t handle a trapped-car call at 9pm, it doesn&rsquo;t deserve to answer any call.
          </p>
          <p>
            Bellory is not a platform you configure or a dashboard you babysit. We build each install by hand around one company&rsquo;s services, prices, coverage, and rules. We test it with the owner before it goes live. And when something needs to change, you tell us and we change it — usually the same day, because the support line is the two of us.
          </p>
          <p>
            We believe automation should be boring in the best way: the phone gets answered, the job gets booked, the owner stays informed, and nobody has to learn new software. That&rsquo;s the whole product.
          </p>
        </div>
      </PageSection>

      <PageSection>
        <div className="grid gap-4 sm:grid-cols-3">
          <InfoCard title="Humans set it up">
            Every install is configured, tested, and launched by a person who knows your rules — not a signup wizard.
          </InfoCard>
          <InfoCard title="Humans support it">
            Questions and changes go straight to the builders. No ticket queue, no chatbot support for your phone-answering product — we see the irony.
          </InfoCard>
          <InfoCard title="Honest by default">
            The receptionist says it&rsquo;s an AI when asked, never invents prices or availability, and hands the call to a person when your rules say so.
          </InfoCard>
        </div>
        <p className="mt-10 max-w-[650px] text-[14.5px] leading-7 text-[#99978C]">
          Want to talk to us directly? Email <a href={contactEmailHref} className="font-semibold text-[#C6F23D] hover:text-[#D3FA5A]">{contactEmail}</a> — one of the two of us replies personally.
        </p>
      </PageSection>
    </MarketingPage>
  );
}
