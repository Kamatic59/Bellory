"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import React, { ReactNode } from "react";
import {
  Activity,
  Building2,
  ChevronDown,
  ClipboardCheck,
  FileChartColumn,
  Menu,
  Plus,
  Search,
  Settings,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "./ui";

export const pages = [
  { id: "accounts", label: "Accounts", icon: Building2, group: "Operate", hint: "Find every business" },
  { id: "setup", label: "New Business Setup", icon: ClipboardCheck, group: "Operate", hint: "Launch checklist" },
  { id: "account", label: "Account Detail", icon: Activity, group: "Operate", hint: "Configure one business" },
  { id: "issues", label: "Issues", icon: TriangleAlert, count: 4, group: "Manage", hint: "Fix what is stuck" },
  { id: "reports", label: "Reports", icon: FileChartColumn, group: "Manage", hint: "Proof of value" },
  { id: "settings", label: "Settings", icon: Settings, group: "Manage", hint: "Team + providers" },
] as const;

export type PageId = (typeof pages)[number]["id"];

const navGroups = ["Operate", "Manage"] as const;

function BelloryMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={clsx(
        "relative shrink-0",
        small ? "size-8" : "size-12",
      )}
      aria-label="Bellory logo"
    >
      <div className="absolute inset-0 rounded-full bg-[#C7F76F]/20 blur-lg" />
      <Image
        src="/brand/bellory-mark.png"
        alt="Bellory"
        width={96}
        height={96}
        priority={!small}
        className="relative size-full object-contain drop-shadow-[0_12px_28px_rgba(199,247,111,.18)]"
      />
      {!small && <span className="absolute -right-1 top-2 size-2.5 rounded-full border-2 border-[#1B1712] bg-[#E05F45]" />}
    </div>
  );
}

function SidebarContent({ active, navigate, issueCount = 0 }: { active: PageId; navigate: (id: PageId) => void; issueCount?: number }) {
  return (
    <div className="flex h-full flex-col">
      <button onClick={() => navigate("accounts")} className="flex items-center gap-3 px-5 py-5 text-left">
        <BelloryMark />
        <div>
          <div className="text-[19px] font-black tracking-[-.045em] text-white">
            Bellory<span className="text-[#C7F76F]">.</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#B7AB98]">AI receptionist operations</div>
        </div>
      </button>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <nav className="space-y-4">
          {navGroups.map((group) => (
            <div key={group}>
              <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#6F5B3E]">{group}</div>
              <div className="space-y-1">
                {pages.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.id;
                  const count: number | undefined = item.id === "issues"
                    ? issueCount
                    : "count" in item && typeof item.count === "number"
                      ? item.count
                      : undefined;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={clsx(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                        isActive
                          ? "bg-[#C7F76F]/10 text-[#D8FF9B] shadow-[inset_0_0_0_1px_rgba(199,247,111,.12)]"
                          : "text-[#B7AB98] hover:bg-white/[.035] hover:text-[#FFF7E8]",
                      )}
                    >
                      {isActive && <motion.span layoutId="nav" className="absolute -left-1 h-6 w-[3px] rounded-full bg-[#C7F76F] shadow-[0_0_12px_rgba(199,247,111,.75)]" />}
                      <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-bold">{item.label}</span>
                        <span className="mt-0.5 block truncate text-[9px] font-medium text-[#94836A]">{item.hint}</span>
                      </span>
                      {count ? (
                        <span className={clsx("grid min-w-5 place-items-center rounded-md px-1.5 py-0.5 text-[9px] font-black", isActive ? "bg-[#C7F76F]/15 text-[#C7F76F]" : "bg-white/5 text-[#94836A]")}>
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="m-3 rounded-2xl border border-white/[.075] bg-gradient-to-br from-white/[.045] to-transparent p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-white">Voice desk pulse</span>
          <span className="pulse-ring size-2 rounded-full bg-[#C7F76F]" />
        </div>
        <div className="space-y-2.5 text-[11px]">
          <div className="flex justify-between text-[#B7AB98]"><span>Answer rate</span><span className="text-[#C7F76F]">99.9%</span></div>
          <div className="flex justify-between text-[#B7AB98]"><span>Avg pickup</span><span className="text-white">1.8s</span></div>
          <div className="flex justify-between text-[#B7AB98]"><span>Urgent handoff</span><span className="text-[#F6C66A]">1 open</span></div>
        </div>
        <button onClick={() => navigate("issues")} className="mt-3 text-[11px] font-bold text-[#C7F76F]">Open issues -&gt;</button>
      </div>

      <div className="flex items-center gap-3 border-t border-white/[.06] p-4">
        <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#F6C66A] to-[#B86B35] text-[10px] font-black text-[#17120C]">KM</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-white">Kael Morgan</div>
          <div className="text-[10px] text-[#94836A]">Workspace admin</div>
        </div>
        <ChevronDown size={13} className="text-[#94836A]" />
      </div>
    </div>
  );
}

export function AppShell({
  active,
  onNavigate,
  children,
  issueCount = 0,
}: {
  active: PageId;
  onNavigate: (id: PageId) => void;
  children: ReactNode;
  issueCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const page = pages.find((item) => item.id === active)!;
  const navigate = (id: PageId) => {
    onNavigate(id);
    setOpen(false);
  };

  return (
    <div className="min-h-screen text-[#FFF7E8]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] border-r border-white/[.06] bg-[#14110C]/95 backdrop-blur-xl md:block">
        <SidebarContent active={active} navigate={navigate} issueCount={issueCount} />
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#12100C]/80 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-[270px] border-r border-white/[.08] bg-[#14110C]"
            >
              <button className="absolute left-[278px] top-4 grid size-9 place-items-center rounded-xl bg-white/10" onClick={() => setOpen(false)}>
                <X size={17} />
              </button>
              <SidebarContent active={active} navigate={navigate} issueCount={issueCount} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="md:pl-[244px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-white/[.055] bg-[#12100C]/78 px-4 backdrop-blur-xl lg:px-7">
          <button className="grid size-9 place-items-center rounded-xl border border-white/[.08] bg-white/[.04] md:hidden" onClick={() => setOpen(true)}>
            <Menu size={17} />
          </button>
          <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C7F76F]">Bellory operator console</div>
            <h1 className="truncate text-lg font-semibold tracking-tight text-white">{page.label}</h1>
          </div>
          <div className="relative hidden w-[270px] lg:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94836A]" />
            <input placeholder="Search accounts, issues..." className="w-full rounded-xl border border-white/[.07] bg-white/[.035] py-2.5 pl-9 pr-3 text-[13px] text-white outline-none placeholder:text-[#94836A] focus:border-[#C7F76F]/25" />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/[.08] px-1.5 py-0.5 text-[9px] text-[#94836A]">Ctrl K</span>
          </div>
          <Button onClick={() => navigate("setup")}>
            <Plus size={14} /> <span className="hidden sm:inline">New Business</span>
          </Button>
        </header>

        <main className="relative min-h-[calc(100vh-72px)] overflow-hidden p-3 sm:p-5 lg:p-7">
          <div className="grid-glow pointer-events-none absolute inset-x-0 top-0 h-[320px] opacity-28" />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="relative mx-auto max-w-[1480px]"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-white/[.09] bg-[#1B1712]/92 p-1.5 shadow-2xl backdrop-blur-xl md:hidden">
        {[pages[0], pages[1], pages[3], pages[4]].map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => navigate(item.id)} className={clsx("flex flex-col items-center gap-1 rounded-xl py-2 text-[8px] font-semibold", active === item.id ? "bg-[#C7F76F]/10 text-[#C7F76F]" : "text-[#94836A]")}>
              <Icon size={16} />
              {item.label.split(" ")[0]}
            </button>
          );
        })}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 rounded-xl py-2 text-[8px] font-semibold text-[#94836A]">
          <Menu size={16} /> More
        </button>
      </nav>
    </div>
  );
}

export { BelloryMark };
