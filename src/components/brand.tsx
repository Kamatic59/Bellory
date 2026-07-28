import clsx from "clsx";

/**
 * Bellory brand mark — two angled rounded forms, traced from the master logo
 * asset (Downloads/new logo.png). Geometry is a faithful vector fit of the
 * raster: flat horizontal caps, matched side curves, 180° point symmetry per
 * form. Do not restyle, add effects to, or animate this mark.
 */
const FORM_PATH =
  "M122 0 L170 0 C169 6 168 11 167 16 L100 160 C93 175 80 188 48 192 L0 192 C1 186 2 181 3 176 L70 32 C77 17 90 4 122 0 Z";

export function BelloryMark({ className, title = "Bellory" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 288 192" role="img" aria-label={title} className={className} fill="var(--lime, #C6F23D)">
      <path d={FORM_PATH} />
      <path d={FORM_PATH} transform="translate(117 0)" />
    </svg>
  );
}

/**
 * Full horizontal lockup: mark + wordmark. Wordmark is set live in Manrope so
 * it stays crisp at every size and inherits currentColor (ivory on dark).
 */
export function BelloryLogo({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center", className)}>
      <BelloryMark className={clsx("h-[1.35em] w-auto", markClassName)} />
      <span
        className={clsx(
          "ml-[0.55em] font-sans text-[1em] font-bold leading-none tracking-[-0.035em] text-[#F3F1E6]",
          wordClassName,
        )}
      >
        Bellory
      </span>
    </span>
  );
}
