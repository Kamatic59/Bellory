import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Bellory early access terms and launch-stage limitations.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms"
      description="These terms cover Bellory's public landing page and early access requests while the product is being prepared for live business deployments."
    >
      <LegalSection title="Early access">
        <p>Submitting the waitlist form does not guarantee acceptance, pricing, availability, or a launch date. Bellory is onboarding businesses in small batches so each setup can be tested before going live.</p>
      </LegalSection>
      <LegalSection title="Product configuration">
        <p>Each business is responsible for reviewing its services, pricing language, calendar rules, fallback contacts, consent requirements, and urgent-call routing before Bellory answers real customer calls.</p>
      </LegalSection>
      <LegalSection title="No professional advice">
        <p>Bellory is a software product. It does not provide legal, medical, financial, or emergency advice. Businesses in regulated industries may need additional compliance review before using AI phone answering.</p>
      </LegalSection>
      <LegalSection title="Changes">
        <p>These launch-stage terms may change as Bellory moves from early access into production service.</p>
      </LegalSection>
    </LegalPage>
  );
}
