import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="grain relative grid min-h-screen place-items-center overflow-hidden px-5 py-16 text-[#FFF7E8]">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-[-20rem] h-[42rem] w-[46rem] -translate-x-1/2 rounded-full bg-[#C7F76F]/[.06] blur-3xl" />
        <div className="grid-glow absolute inset-x-0 top-0 h-[34rem] opacity-40" />
      </div>

      <div className="glass relative w-full max-w-md rounded-[22px]">
        <div className="flex items-center justify-between border-b border-white/[.07] px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/brand/bellory-bell.png" alt="Bellory" width={30} height={30} />
            <p className="font-display text-[17px] font-semibold tracking-[-.02em] text-white">Bellory</p>
          </div>
          <p className="font-mono-ui text-[11px] text-[#94836A]">Error 404</p>
        </div>

        <div className="px-6 py-8">
          <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.22em] text-[#A9D96B]">Call log</p>
          <h1 className="font-display mt-3 text-3xl font-medium leading-[1.05] tracking-[-.02em] text-white">
            This line isn&rsquo;t in service.
          </h1>
          <p className="mt-3 text-base leading-7 text-[#B7AB98]">
            The page you dialed doesn&rsquo;t exist — it may have moved, or the address has a typo.
          </p>
        </div>

        <div className="px-6"><div className="rule-dashed opacity-60" /></div>

        <div className="flex flex-wrap gap-3 px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C7F76F] px-4 py-2.5 text-[13px] font-bold text-[#14110B] transition hover:bg-[#D8FF9B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#100E0A]"
          >
            Back to the front desk
          </Link>
          <Link
            href="/#waitlist"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[.12] bg-white/[.05] px-4 py-2.5 text-[13px] font-bold text-[#FFF7E8] transition hover:bg-white/[.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#100E0A]"
          >
            Request a private install
          </Link>
        </div>
      </div>
    </main>
  );
}
