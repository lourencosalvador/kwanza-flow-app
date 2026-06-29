"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/icon";
import { NAV, NAV_GROUPS } from "@/config/nav";
import { useUIStore } from "@/store/ui-store";
import { useFinancialStore } from "@/store/financial-store";
import { cn } from "@/lib/utils";
import { formatCompact } from "@/lib/format";
import { Progress } from "@/components/ui/progress";

function MissionWidget() {
  const missions = useFinancialStore((s) => s.snapshot.missions);
  const accounts = useFinancialStore((s) => s.snapshot.accounts);
  const primary = missions.find((m) => m.isPrimary && m.status === "ativa");
  if (!primary?.targetAmount) return null;

  const savings = accounts
    .filter((a) => a.kind === "poupanca" || a.kind === "investimento")
    .reduce((s, a) => s + a.balance, 0);
  const pct = Math.min(100, Math.round((savings / primary.targetAmount) * 100));

  return (
    <Link
      href="/missoes"
      className="group mx-3 mb-3 block rounded-xl border border-sidebar-border bg-gradient-to-br from-primary/10 to-transparent p-3 transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-primary">
        <Icon name="Flag" className="size-3.5" />
        Missão principal
      </div>
      <p className="mt-1.5 line-clamp-1 text-sm font-medium">{primary.title}</p>
      <Progress value={pct} className="mt-2 h-1.5" />
      <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
        {formatCompact(savings)} de {formatCompact(primary.targetAmount)} · {pct}%
      </p>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {group}
          </p>
          <ul className="space-y-0.5">
            {NAV.filter((n) => n.group === group).map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                      />
                    )}
                    <Icon
                      name={item.icon}
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-primary" : "",
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Icon name="CircleDollarSign" className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">KwanzaFlow</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Financial OS
        </p>
      </div>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <Brand />
      <NavLinks />
      <MissionWidget />
    </aside>
  );
}

export function MobileSidebar() {
  const open = useUIStore((s) => s.sidebarOpen);
  const setSidebar = useUIStore((s) => s.setSidebar);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebar(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar lg:hidden"
          >
            <Brand />
            <NavLinks onNavigate={() => setSidebar(false)} />
            <MissionWidget />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
