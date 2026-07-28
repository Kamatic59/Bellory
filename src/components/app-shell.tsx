"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React, { ReactNode } from "react";
import { BelloryLogo } from "./brand";
import {
  Activity,
  Building2,
  ChevronDown,
  ClipboardCheck,
  FileChartColumn,
  Menu,
  PhoneOutgoing,
  Plus,
  Search,
  Settings,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "./ui";

export const pages = [
  { id: "sales", label: "Sales", icon: PhoneOutgoing, group: "Operate", hint: "Dials, pilots, the climb to 25" },
  { id: "accounts", label: "Accounts", icon: Building2, group: "Operate", hint: "Find every business" },
  { id: "setup", label: "New Business Setup", icon: ClipboardCheck, group: "Operate", hint: "Launch checklist" },
  { id: "account", label: "Account Detail", icon: Activity, group: "Operate", hint: "Configure one business" },
  { id: "issues", label: "Issues", icon: TriangleAlert, group: "Manage", hint: "Fix what is stuck" },
  { id: "reports", label: "Reports", icon: FileChartColumn, group: "Manage", hint: "Proof of value" },
  { id: "settings", label: "Settings", icon: Settings, group: "Manage", hint: "Team + providers" },
] as const;

export type PageId = (typeof pages)[number]["id"];

const navGroups = ["Operate", "Manage"] as const;

function SidebarContent({ active, navigate, issueCount = 0 }: { active: PageId; navigate: (id: PageId) => void; issueCount?: number }) {
  return (
    <div className="flex h-full flex-col">
      <button onClick={() => navigate("accounts")} className="flex flex-col items-start gap-1.5 px-5 pb-5 pt-6 text-left">
        <BelloryLogo className="text-[17px]" />
        <div className="font-mono-ui text-[9px] font-semibold uppercase tracking-[.22em] text-[#706F66]">Operator console</div>
      </button>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <nav className="space-y-6 pt-2">
          {navGroups.map((group) => (
            <div key={group}>
              <div className="font-mono-ui mb-2 px-3 text-[9px] font-semibold uppercase tracking-[.26em] text-[#706F66]">{group}</div>
              <div className="space-y-0.5">
                {pages.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.id;
                  const count = item.id === "issues" && issueCount > 0 ? issueCount : undefined;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={clsx(
                        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        isActive
                          ? "bg-[#C6F23D]/[.08] text-[#D3FA5A]"
                          : "text-[#99978C] hover:bg-white/[.03] hover:text-[#F3F1E6]",
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="absolute left-0 h-5 w-[2.5px] rounded-full bg-[#C6F23D] shadow-[0_0_10px_rgba(198,242,61,.7)]"
                        />
                      )}
                      <Icon size={15} strokeWidth={isActive ? 2.1 : 1.7} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold tracking-[-.01em]">{item.label}</span>
                      {count ? (
                        <span className={clsx(
                          "font-mono-ui grid min-w-[20px] place-items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold",
                          isActive ? "bg-[#C6F23D]/15 text-[#C6F23D]" : "bg-[#E95A50]/[.14] text-[#F0837B]",
                        )}>
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

      <div className="m-3 rounded-xl border border-white/[.07] bg-gradient-to-br from-white/[.035] to-transparent p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono-ui text-[9px] font-semibold uppercase tracking-[.2em] text-[#99978C]">Console status</span>
          <span className="pulse-ring size-1.5 rounded-full bg-[#C6F23D]" />
        </div>
        <p className="mt-2.5 text-[12px] leading-5 text-[#99978C]">
          {issueCount > 0
            ? `${issueCount} open issue${issueCount === 1 ? "" : "s"} need${issueCount === 1 ? "s" : ""} operator review.`
            : "No open issues. All accounts nominal."}
        </p>
        <button
          onClick={() => navigate("issues")}
          className="font-mono-ui mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[#C6F23D] transition hover:text-[#D3FA5A]"
        >
          Open issues →
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-white/[.06] p-4">
        <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#FF7A1A] to-[#FF7A1A] text-[10px] font-black text-[#12120E]">KM</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-white">Kael Morgan</div>
          <div className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#99978C]">Workspace admin</div>
        </div>
        <ChevronDown size={13} className="text-[#99978C]" />
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
    <div className="grain min-h-screen text-[#F3F1E6]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/[.06] bg-[#171812]/95 backdrop-blur-xl md:block">
        <SidebarContent active={active} navigate={navigate} issueCount={issueCount} />
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#12120E]/80 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-[272px] border-r border-white/[.08] bg-[#171812]"
            >
              <button className="absolute left-[282px] top-4 grid size-9 place-items-center rounded-xl bg-white/10" onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={17} />
              </button>
              <SidebarContent active={active} navigate={navigate} issueCount={issueCount} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="md:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-white/[.06] bg-[#12120E]/80 px-4 backdrop-blur-xl lg:px-7">
          <button className="grid size-9 place-items-center rounded-xl border border-white/[.08] bg-white/[.04] md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={17} />
          </button>
          <div className="flex min-w-0 flex-1 items-baseline gap-3">
            <h1 className="truncate text-[15px] font-bold tracking-[-.015em] text-white">{page.label}</h1>
            <span className="font-mono-ui hidden truncate text-[10px] uppercase tracking-[.14em] text-[#706F66] sm:block">{page.hint}</span>
          </div>
          <div className="relative hidden w-[280px] lg:block">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99978C]" />
            <input
              placeholder="Search accounts, issues…"
              className="w-full rounded-lg border border-white/[.07] bg-white/[.03] py-2 pl-9 pr-14 text-[12.5px] text-white outline-none transition placeholder:text-[#706F66] hover:border-white/[.12] focus:border-[#C6F23D]/30"
            />
            <span className="font-mono-ui absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/[.08] px-1.5 py-0.5 text-[9px] text-[#706F66]">⌘K</span>
          </div>
          <Button onClick={() => navigate("setup")} className="px-3 py-2 text-[12px]">
            <Plus size={13} /> <span className="hidden sm:inline">New Business</span>
          </Button>
        </header>

        <main className="relative min-h-[calc(100vh-64px)] overflow-hidden p-3 sm:p-5 lg:p-7">
          <div className="grid-glow pointer-events-none absolute inset-x-0 top-0 h-[300px] opacity-30" />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="relative mx-auto max-w-[1480px]"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-white/[.09] bg-[#1C1E17]/94 p-1.5 shadow-2xl backdrop-blur-xl md:hidden">
        {[pages[0], pages[1], pages[4], pages[5]].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-[8px] font-semibold",
                active === item.id ? "bg-[#C6F23D]/10 text-[#C6F23D]" : "text-[#99978C]",
              )}
            >
              <Icon size={16} />
              {item.label.split(" ")[0]}
            </button>
          );
        })}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 rounded-xl py-2 text-[8px] font-semibold text-[#99978C]">
          <Menu size={16} /> More
        </button>
      </nav>
    </div>
  );
}
