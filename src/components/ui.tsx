"use client";

import { motion } from "framer-motion";
import { Check, ChevronRight, LucideIcon, X } from "lucide-react";
import { ChangeEvent, ReactNode } from "react";
import clsx from "clsx";

export function Card({ children, className = "", hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .35 }}
      whileHover={hover ? { y: -3 } : undefined}
      className={clsx("glass rounded-[22px]", className)}
    >
      {children}
    </motion.div>
  );
}

export function Badge({ children, tone = "mint" }: { children: ReactNode; tone?: "mint" | "honey" | "coral" | "blue" | "muted" }) {
  const tones = {
    mint: "border-[#C7F76F]/20 bg-[#C7F76F]/10 text-[#D8FF9B]",
    honey: "border-[#F6C66A]/20 bg-[#F6C66A]/10 text-[#ffd872]",
    coral: "border-[#E05F45]/20 bg-[#E05F45]/10 text-[#F08B72]",
    blue: "border-[#BFA777]/20 bg-[#BFA777]/10 text-[#E7D6A1]",
    muted: "border-white/10 bg-white/5 text-[#B7AB98]",
  };
  return <span className={clsx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none", tones[tone])}>{children}</span>;
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
    primary: "bg-[#C7F76F] text-[#17120C] shadow-[0_8px_24px_rgba(199,247,111,.13)] hover:bg-[#D8FF9B]",
    secondary: "border border-white/10 bg-white/[.055] text-white hover:bg-white/[.09]",
    ghost: "text-[#B7AB98] hover:bg-white/5 hover:text-white",
    danger: "border border-[#E05F45]/20 bg-[#E05F45]/10 text-[#F08B72] hover:bg-[#E05F45]/15",
  };
  return <button type={type} disabled={disabled} aria-label={ariaLabel} onClick={onClick} className={clsx("inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F76F]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12100C] disabled:cursor-not-allowed disabled:opacity-50", styles[kind], className)}>{children}</button>;
}

export function IconBox({ icon: Icon, tone = "mint" }: { icon: LucideIcon; tone?: "mint" | "honey" | "coral" | "blue" | "violet" }) {
  const tones = {
    mint: "bg-[#C7F76F]/10 text-[#C7F76F]",
    honey: "bg-[#F6C66A]/10 text-[#F6C66A]",
    coral: "bg-[#E05F45]/10 text-[#E8795F]",
    blue: "bg-[#BFA777]/10 text-[#E7D6A1]",
    violet: "bg-[#D98B3E]/10 text-[#F6C66A]",
  };
  return <div className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}><Icon size={18} /></div>;
}

export function SectionTitle({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-1 text-[11px] font-bold uppercase tracking-[.18em] text-[#C7F76F]">{eyebrow}</p>}<h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2></div>{action}</div>;
}

export function Progress({ value, tone = "mint" }: { value: number; tone?: "mint" | "honey" | "coral" | "blue" }) {
  const tones = { mint: "from-[#94C759] to-[#C7F76F]", honey: "from-[#D98B3E] to-[#F6C66A]", coral: "from-[#C94A34] to-[#E8795F]", blue: "from-[#BFA777] to-[#FFF0B8]" };
  return <div className="h-2 overflow-hidden rounded-full bg-white/[.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: .8 }} className={clsx("h-full rounded-full bg-gradient-to-r", tones[tone])} /></div>;
}

export function Toggle({ enabled, onClick }: { enabled: boolean; onClick?: () => void }) {
  return <button onClick={onClick} className={clsx("relative h-6 w-11 rounded-full transition", enabled ? "bg-[#C7F76F]" : "bg-white/10")}><span className={clsx("absolute top-1 size-4 rounded-full bg-white shadow transition", enabled ? "left-6" : "left-1")} /></button>;
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
      className={clsx("w-full rounded-xl border border-white/[.08] bg-[#15110C]/70 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-[#94836A] focus:border-[#C7F76F]/40 focus-visible:ring-2 focus-visible:ring-[#C7F76F]/20 disabled:cursor-not-allowed disabled:opacity-55", className)}
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

  return <select {...controlProps} aria-label={ariaLabel} name={name} className={clsx("w-full rounded-xl border border-white/[.08] bg-[#15110C] px-3.5 py-3 text-sm text-white outline-none transition focus:border-[#C7F76F]/40 focus-visible:ring-2 focus-visible:ring-[#C7F76F]/20", className)}>{children}</select>;
}

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-[#12100C]/80 p-4 backdrop-blur-md" onMouseDown={onClose}><motion.div initial={{ opacity: 0, scale: .96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} onMouseDown={(e) => e.stopPropagation()} className="glass w-full max-w-xl rounded-3xl p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-semibold">{title}</h3><button onClick={onClose} className="grid size-9 place-items-center rounded-xl bg-white/5 text-[#B7AB98] hover:text-white"><X size={17} /></button></div>{children}</motion.div></div>;
}

export function EmptyCheck({ text, checked = true }: { text: string; checked?: boolean }) {
  return <div className="flex items-center gap-2.5 rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-[13px] text-[#EFE1C8]"><span className={clsx("grid size-5 place-items-center rounded-full", checked ? "bg-[#C7F76F]/15 text-[#C7F76F]" : "bg-white/5 text-[#94836A]")}>{checked ? <Check size={12} /> : <ChevronRight size={12} />}</span>{text}</div>;
}

export function DemoState({ title, description, tone = "mint" }: { title: string; description: string; tone?: "mint" | "honey" | "coral" }) {
  const dot = {
    mint: "bg-[#C7F76F]",
    honey: "bg-[#F6C66A]",
    coral: "bg-[#E05F45]",
  };
  return (
    <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={clsx("size-2 rounded-full", dot[tone])} />
        <p className="text-[12px] font-bold text-white">{title}</p>
      </div>
      <p className="text-[11px] leading-5 text-[#B7AB98]">{description}</p>
    </div>
  );
}
