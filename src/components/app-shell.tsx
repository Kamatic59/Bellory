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
  { id: "issues", label: "Issues", icon: TriangleAlert, group: "Manage", hint: "Fix what is stuck" },
  { id: "reports", label: "Reports", icon: FileChartColumn, group: "Manage", hint: "Proof of value" },
  { id: "settings", label: "Settings", icon: Settings, group: "Manage", hint: "Team + providers" },
] as const;

export type PageId = (typeof pages)[number]["id"];

const navGroups = ["Operate", "Manage"] as const;

function BelloryMark({ small = false }: { small?: boolean }) {
  return (
    <div className={clsx("relative shrink-0", small ? "size-8" : "size-10")} aria-label="Bellory logo">
      <div className="absolute inset-0 rounded-full bg-[#C7F76F]/[.16] blur-lg" />
      <Image
        src="/brand/bellory-bell.png"
        alt="Bellory"
        width={96}
        height={96}
        priority={!small}
        className="relative size-full object-contain drop-shadow-[0_10px_24px_rgba(199,247,111,.18)]"
      />
    </div>
  );
}

function SidebarContent({ active, navigate, issueCount = 0 }: { active: PageId; navigate: (id: PageId) => void; issueCount?: number }) {
  return (
    <div className="flex h-full flex-col">
      <button onClick={() => navigate("accounts")} className="flex items-center gap-3 px-5 pb-5 pt-6 text-left">
        <BelloryMark />
        <div>
          <div className="font-display text-[19px] font-semibold tracking-[-.02em] text-white">Bellory</div>
          <div className="font-mono-ui -mt-0.5 text-[9px] font-semibold uppercase tracking-[.22em] text-[#94836A]">Operator console</div>
        </div>
      </button>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <nav className="space-y-6 pt-2">
          {navGroups.map((group) => (
            <div key={group}>
              <div className="font-mono-ui mb-2 px-3 text-[9px] font-semibold uppercase tracking-[.26em] text-[#6E5F49]">{group}</div>
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
                          ? "bg-[#C7F76F]/[.08] text-[#D8FF9B]"
                          : "text-[#A79A85] hover:bg-white/[.03] hover:text-[#FFF7E8]",
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="absolute left-0 h-5 w-[2.5px] rounded-full bg-[#C7F76F] shadow-[0_0_10px_rgba(199,247,111,.7)]"
                        />
                      )}
                      <Icon size={15} strokeWidth={isActive ? 2.1 : 1.7} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold tracking-[-.01em]">{item.label}</span>
                      {count ? (
                        <span className={clsx(
                          "font-mono-ui grid min-w-[20px] place-items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold",
                          isActive ? "bg-[#C7F76F]/15 text-[#C7F76F]" : "bg-[#E05F45]/[.14] text-[#F08B72]",
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
          <span className="font-mono-ui text-[9px] font-semibold uppercase tracking-[.2em] text-[#94836A]">Console status</span>
          <span className="pulse-ring size-1.5 rounded-full bg-[#C7F76F]" />
        </div>
        <p className="mt-2.5 text-[12px] leading-5 text-[#C6B9A6]">
          {issueCount > 0
            ? `${issueCount} open issue${issueCount === 1 ? "" : "s"} need${issueCount === 1 ? "s" : ""} operator review.`
            : "No open issues. All accounts nominal."}
        </p>
        <button
          onClick={() => navigate("issues")}
          className="font-mono-ui mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[#C7F76F] transition hover:text-[#D8FF9B]"
        >
          Open issues →
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-white/[.06] p-4">
        <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#F6C66A] to-[#B86B35] text-[10px] font-black text-[#17120C]">KM</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-white">Kael Morgan</div>
          <div className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#94836A]">Workspace admin</div>
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
    <div className="grain min-h-screen text-[#FFF7E8]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/[.06] bg-[#13100B]/95 backdrop-blur-xl md:block">
        <SidebarContent active={active} navigate={navigate} issueCount={issueCount} />
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#100E0A]/80 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-[272px] border-r border-white/[.08] bg-[#13100B]"
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
        <header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-white/[.06] bg-[#100E0A]/80 px-4 backdrop-blur-xl lg:px-7">
          <button className="grid size-9 place-items-center rounded-xl border border-white/[.08] bg-white/[.04] md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={17} />
          </button>
          <div className="flex min-w-0 flex-1 items-baseline gap-3">
            <h1 className="truncate text-[15px] font-bold tracking-[-.015em] text-white">{page.label}</h1>
            <span className="font-mono-ui hidden truncate text-[10px] uppercase tracking-[.14em] text-[#6E5F49] sm:block">{page.hint}</span>
          </div>
          <div className="relative hidden w-[280px] lg:block">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94836A]" />
            <input
              placeholder="Search accounts, issues…"
              className="w-full rounded-lg border border-white/[.07] bg-white/[.03] py-2 pl-9 pr-14 text-[12.5px] text-white outline-none transition placeholder:text-[#6E5F49] hover:border-white/[.12] focus:border-[#C7F76F]/30"
            />
            <span className="font-mono-ui absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/[.08] px-1.5 py-0.5 text-[9px] text-[#6E5F49]">⌘K</span>
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

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-white/[.09] bg-[#17130E]/94 p-1.5 shadow-2xl backdrop-blur-xl md:hidden">
        {[pages[0], pages[1], pages[3], pages[4]].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-[8px] font-semibold",
                active === item.id ? "bg-[#C7F76F]/10 text-[#C7F76F]" : "text-[#94836A]",
              )}
            >
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
