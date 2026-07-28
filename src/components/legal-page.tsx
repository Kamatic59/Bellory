import { SiteFooter, SiteNav } from "./site-chrome";

export function LegalPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grain relative min-h-screen text-[#F3F1E6]">
      <SiteNav />
      <main id="main" className="relative z-10 px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="glass mt-4 rounded-[18px] p-6 sm:p-10">
            <p className="font-mono-ui text-[11px] font-semibold uppercase tracking-[.18em] text-[#8FD14F]">{eyebrow}</p>
            <h1 className="font-display mt-4 text-4xl tracking-[-.02em] text-white sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-[650px] text-base leading-8 text-[#99978C]">{description}</p>
            <div className="mt-10 max-w-[650px] space-y-8 text-sm leading-7 text-[#D8D5CA]">{children}</div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-[-.015em] text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
