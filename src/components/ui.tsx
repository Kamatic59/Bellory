"use client";

import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronRight, LucideIcon, X } from "lucide-react";
import { ChangeEvent, ReactNode } from "react";
import clsx from "clsx";

export function Card({ children, className = "", hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .3, ease: "easeOut" }}
      whileHover={hover ? { y: -3 } : undefined}
      className={clsx("glass rounded-[20px]", hover && "transition-shadow hover:shadow-[0_24px_60px_rgba(0,0,0,.3)]", className)}
    >
      {children}
    </motion.div>
  );
}

export function Badge({ children, tone = "mint" }: { children: ReactNode; tone?: "mint" | "honey" | "coral" | "blue" | "muted" }) {
  const tones = {
    mint: "border-[#C7F76F]/25 bg-[#C7F76F]/[.08] text-[#D8FF9B]",
    honey: "border-[#F6C66A]/25 bg-[#F6C66A]/[.08] text-[#FFD872]",
    coral: "border-[#E05F45]/25 bg-[#E05F45]/[.08] text-[#F08B72]",
    blue: "border-[#BFA777]/25 bg-[#BFA777]/[.08] text-[#E7D6A1]",
    muted: "border-white/10 bg-white/[.04] text-[#B7AB98]",
  };
  return (
    <span className={clsx("font-mono-ui inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase leading-none tracking-[.14em]", tones[tone])}>
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  kind = "primary",
  className = "",
  disabled = false,
  type = "button",
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
}) {
  const styles = {
    primary:
      "bg-[#C7F76F] text-[#14110B] shadow-[0_1px_0_rgba(255,255,255,.35)_inset,0_10px_28px_rgba(199,247,111,.16)] hover:bg-[#D8FF9B] active:translate-y-px",
    secondary:
      "border border-white/[.12] bg-white/[.05] text-[#FFF7E8] shadow-[0_1px_0_rgba(255,247,232,.05)_inset] hover:border-white/[.2] hover:bg-white/[.08] active:translate-y-px",
    ghost: "text-[#B7AB98] hover:bg-white/[.05] hover:text-white",
    danger: "border border-[#E05F45]/25 bg-[#E05F45]/10 text-[#F08B72] hover:bg-[#E05F45]/15",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-bold tracking-[-.01em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#100E0A] disabled:cursor-not-allowed disabled:opacity-50",
        styles[kind],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function IconBox({ icon: Icon, tone = "mint" }: { icon: LucideIcon; tone?: "mint" | "honey" | "coral" | "blue" | "violet" }) {
  const tones = {
    mint: "bg-[#C7F76F]/[.09] text-[#C7F76F] shadow-[inset_0_0_0_1px_rgba(199,247,111,.14)]",
    honey: "bg-[#F6C66A]/[.09] text-[#F6C66A] shadow-[inset_0_0_0_1px_rgba(246,198,106,.14)]",
    coral: "bg-[#E05F45]/[.09] text-[#E8795F] shadow-[inset_0_0_0_1px_rgba(224,95,69,.14)]",
    blue: "bg-[#BFA777]/[.09] text-[#E7D6A1] shadow-[inset_0_0_0_1px_rgba(191,167,119,.14)]",
    violet: "bg-[#D98B3E]/[.09] text-[#F6C66A] shadow-[inset_0_0_0_1px_rgba(217,139,62,.14)]",
  };
  return <div className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}><Icon size={17} strokeWidth={1.9} /></div>;
}

export function SectionTitle({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="font-mono-ui mb-1.5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#94C759]">{eyebrow}</p>}
        <h2 className="text-lg font-semibold tracking-[-.02em] text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Progress({ value, tone = "mint" }: { value: number; tone?: "mint" | "honey" | "coral" | "blue" }) {
  const tones = { mint: "from-[#94C759] to-[#C7F76F]", honey: "from-[#D98B3E] to-[#F6C66A]", coral: "from-[#C94A34] to-[#E8795F]", blue: "from-[#BFA777] to-[#FFF0B8]" };
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/[.06] shadow-[inset_0_1px_2px_rgba(0,0,0,.3)]">
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: .7, ease: "easeOut" }} className={clsx("h-full rounded-full bg-gradient-to-r", tones[tone])} />
    </div>
  );
}

export function Toggle({ enabled, onClick }: { enabled: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={enabled}
      className={clsx("relative h-6 w-11 rounded-full transition-colors duration-200", enabled ? "bg-[#C7F76F]" : "bg-white/10")}
    >
      <span className={clsx("absolute top-1 size-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.4)] transition-all duration-200", enabled ? "left-6" : "left-1")} />
    </button>
  );
}

export function Input({
  placeholder,
  value,
  defaultValue,
  onChange,
  className = "",
  type = "text",
  disabled = false,
  required = false,
  ariaLabel,
  name,
  autoComplete,
}: {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  name?: string;
  autoComplete?: string;
}) {
  const controlProps = onChange
    ? { value: value ?? "", onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value) }
    : { defaultValue: value ?? defaultValue };

  return (
    <input
      type={type}
      disabled={disabled}
      required={required}
      aria-label={ariaLabel}
      name={name}
      autoComplete={autoComplete}
      placeholder={placeholder}
      {...controlProps}
      className={clsx(
        "w-full rounded-xl border border-white/[.09] bg-[#13100B]/80 px-3.5 py-3 text-sm text-white shadow-[inset_0_1px_3px_rgba(0,0,0,.25)] outline-none transition placeholder:text-[#94836A] hover:border-white/[.14] focus:border-[#C7F76F]/45 focus-visible:ring-2 focus-visible:ring-[#C7F76F]/20 disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
    />
  );
}

export function Select({
  children,
  className = "",
  value,
  onChange,
  ariaLabel,
  name,
}: {
  children: ReactNode;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  name?: string;
}) {
  const controlProps = onChange ? { value: value ?? "", onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value) } : {};

  return (
    <div className={clsx("relative", className.includes("w-") ? "" : "w-full")}>
      <select
        {...controlProps}
        aria-label={ariaLabel}
        name={name}
        className={clsx(
          "w-full appearance-none rounded-xl border border-white/[.09] bg-[#13100B] px-3.5 py-3 pr-9 text-sm text-white shadow-[inset_0_1px_3px_rgba(0,0,0,.25)] outline-none transition hover:border-white/[.14] focus:border-[#C7F76F]/45 focus-visible:ring-2 focus-visible:ring-[#C7F76F]/20",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94836A]" />
    </div>
  );
}

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#100E0A]/82 p-4 backdrop-blur-md" onMouseDown={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: .97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: .2, ease: "easeOut" }}
        onMouseDown={(e) => e.stopPropagation()}
        className="glass w-full max-w-xl rounded-3xl p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-[-.02em]">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-xl bg-white/[.05] text-[#B7AB98] transition hover:bg-white/[.09] hover:text-white">
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export function EmptyCheck({ text, checked = true }: { text: string; checked?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[.07] bg-white/[.02] p-3 text-[13px] text-[#EFE1C8]">
      <span className={clsx("grid size-5 shrink-0 place-items-center rounded-full", checked ? "bg-[#C7F76F]/15 text-[#C7F76F]" : "bg-white/[.05] text-[#94836A]")}>
        {checked ? <Check size={12} /> : <ChevronRight size={12} />}
      </span>
      {text}
    </div>
  );
}

export function DemoState({ title, description, tone = "mint" }: { title: string; description: string; tone?: "mint" | "honey" | "coral" }) {
  const styles = {
    mint: { dot: "bg-[#C7F76F]", border: "border-[#C7F76F]/[.14]" },
    honey: { dot: "bg-[#F6C66A]", border: "border-[#F6C66A]/[.14]" },
    coral: { dot: "bg-[#E05F45]", border: "border-[#E05F45]/[.2]" },
  };
  return (
    <div className={clsx("rounded-2xl border bg-white/[.02] p-4", styles[tone].border)}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className={clsx("size-1.5 rounded-full", styles[tone].dot)} />
        <p className="text-[12px] font-bold text-white">{title}</p>
      </div>
      <p className="text-[11px] leading-5 text-[#B7AB98]">{description}</p>
    </div>
  );
}
