"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React, { ReactNode } from "react";
import { BelloryLogo } from "./brand";
import {
  Activity,
  Building2,
  ClipboardCheck,
  FileChartColumn,
  Menu,
  PhoneOutgoing,
  Plus,
  Settings,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "./ui";

export const pages = [
  { id: "sales", label: "Call List", icon: PhoneOutgoing, group: "Selling", hint: "Who to call and what to say" },
  { id: "accounts", label: "Customers", icon: Building2, group: "Selling", hint: "Every business we answer for" },
  { id: "setup", label: "Add a Customer", icon: ClipboardCheck, group: "Selling", hint: "Set up a new business step by step" },
  { id: "account", label: "Customer Details", icon: Activity, group: "Selling", hint: "Change one business's settings" },
  { id: "issues", label: "Problems", icon: TriangleAlert, group: "Checking", hint: "Anything that needs fixing" },
  { id: "reports", label: "Results", icon: FileChartColumn, group: "Checking", hint: "What the AI did for each customer" },
  { id: "settings", label: "Settings", icon: Settings, group: "Checking", hint: "Logins and connected services" },
] as const;

export type PageId = (typeof pages)[number]["id"];

const navGroups = ["Selling", "Checking"] as const;

export type ConsoleRole = "admin" | "caller";
export type SessionInfo = { username: string; role: ConsoleRole };

function initialsOf(name: string) {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function SidebarContent({
  active,
  navigate,
  issueCount = 0,
  session,
}: {
  active: PageId;
  navigate: (id: PageId) => void;
  issueCount?: number;
  session: SessionInfo | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <button onClick={() => navigate("accounts")} className="flex flex-col items-start gap-1.5 px-5 pb-5 pt-6 text-left">
        <BelloryLogo className="text-[17px]" />
        <div className="font-mono-ui text-[9px] font-semibold uppercase tracking-[.22em] text-[#706F66]">Staff area</div>
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
          <span className="font-mono-ui text-[9px] font-semibold uppercase tracking-[.2em] text-[#99978C]">Right now</span>
          <span className="pulse-ring size-1.5 rounded-full bg-[#C6F23D]" />
        </div>
        <p className="mt-2.5 text-[12px] leading-5 text-[#99978C]">
          {issueCount > 0
            ? `${issueCount} thing${issueCount === 1 ? "" : "s"} need${issueCount === 1 ? "s" : ""} a look.`
            : "Nothing is broken. Every customer is running fine."}
        </p>
        <button
          onClick={() => navigate("issues")}
          className="font-mono-ui mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[#C6F23D] transition hover:text-[#D3FA5A]"
        >
          Open issues →
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-white/[.06] p-4">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#FF7A1A] to-[#FF7A1A] text-[10px] font-black text-[#12120E]">
          {session ? initialsOf(session.username) : "…"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-white">{session?.username ?? "Signing in…"}</div>
          <div className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#99978C]">
            {session?.role === "caller" ? "Caller" : "Owner"}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Callers get one page and no navigation — the call list is the whole app for
 * them, so there is nothing to get lost in and nothing they can break.
 */
function CallerShell({ children, session }: { children: ReactNode; session: SessionInfo | null }) {
  return (
    <div className="grain min-h-screen text-[#F3F1E6]">
      <header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-white/[.06] bg-[#12120E]/85 px-4 backdrop-blur-xl lg:px-7">
        <BelloryLogo className="text-[16px]" />
        <div className="min-w-0 flex-1" />
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#FF7A1A] to-[#FF7A1A] text-[10px] font-black text-[#12120E]">
            {session ? initialsOf(session.username) : "…"}
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-[12px] font-semibold text-white">{session?.username ?? "Signing in…"}</div>
            <div className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#99978C]">Caller</div>
          </div>
        </div>
      </header>
      <main className="relative min-h-[calc(100vh-64px)] overflow-hidden p-3 sm:p-5 lg:p-7">
        <div className="grid-glow pointer-events-none absolute inset-x-0 top-0 h-[300px] opacity-30" />
        <div className="relative mx-auto max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}

export function AppShell({
  active,
  onNavigate,
  children,
  issueCount = 0,
  session,
}: {
  active: PageId;
  onNavigate: (id: PageId) => void;
  children: ReactNode;
  issueCount?: number;
  session: SessionInfo | null;
}) {
  const [open, setOpen] = React.useState(false);
  const page = pages.find((item) => item.id === active)!;
  const navigate = (id: PageId) => {
    onNavigate(id);
    setOpen(false);
  };

  if (session?.role === "caller") {
    return <CallerShell session={session}>{children}</CallerShell>;
  }

  return (
    <div className="grain min-h-screen text-[#F3F1E6]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/[.06] bg-[#171812]/95 backdrop-blur-xl md:block">
        <SidebarContent active={active} navigate={navigate} issueCount={issueCount} session={session} />
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
              <SidebarContent active={active} navigate={navigate} issueCount={issueCount} session={session} />
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
          <Button onClick={() => navigate("setup")} className="px-3 py-2 text-[12px]">
            <Plus size={13} /> <span className="hidden sm:inline">Add a Customer</span>
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
