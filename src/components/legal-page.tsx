import Link from "next/link";

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
    <main className="min-h-screen bg-[#100E0A] px-4 py-8 text-[#FFF7E8] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-3 text-sm font-bold text-[#C7F76F]">
          Back to Bellory
        </Link>
        <div className="glass mt-12 rounded-[22px] p-6 sm:p-10">
          <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#C7F76F]">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-.06em] text-white sm:text-6xl">{title}</h1>
          <p className="mt-5 text-base leading-8 text-[#D8CCB8]">{description}</p>
          <div className="mt-10 space-y-8 text-sm leading-7 text-[#D8CCB8]">{children}</div>
        </div>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-[-.035em] text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
