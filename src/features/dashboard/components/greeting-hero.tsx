"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useFinancialReport } from "@/hooks/use-financial-report";
import { useFinancialStore } from "@/store/financial-store";
import { greeting, formatCurrency } from "@/lib/format";

function HealthRing({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const tone =
    score >= 70 ? "var(--success)" : score >= 40 ? "var(--warning)" : "var(--destructive)";
  return (
    <div className="relative grid size-[68px] place-items-center">
      <svg className="size-[68px] -rotate-90" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <motion.circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-sm font-semibold tabular-nums">{score}</span>
    </div>
  );
}

export function GreetingHero() {
  const report = useFinancialReport();
  const profile = useFinancialStore((s) => s.snapshot.profile);
  const firstName = profile.fullName.split(" ")[0];

  const insight =
    report.cashFlow.savingsRate >= 0.2
      ? `Excelente ritmo: está a poupar ${Math.round(report.cashFlow.savingsRate * 100)}% das suas receitas este mês.`
      : report.netWorth.totalDebt > 0
        ? `Tem ${formatCurrency(report.netWorth.totalDebt)} em dívidas. Cada pagamento aproxima-o da liberdade financeira.`
        : `O seu património líquido é ${formatCurrency(report.netWorth.netWorth)}. Continue a construir.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.07] via-card to-card p-6"
    >
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{greeting()},</p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {firstName} 👋
        </h2>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="text-balance">{insight}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center">
        <HealthRing score={report.healthScore} />
        <span className="mt-1 text-[11px] text-muted-foreground">Saúde</span>
      </div>
    </motion.div>
  );
}
