"use client";

import { StatCard } from "@/components/shared/stat-card";
import { useFinancialReport } from "@/hooks/use-financial-report";
import { formatCompact, formatCurrency, formatMonths, formatPercent } from "@/lib/format";

export function SummaryGrid() {
  const r = useFinancialReport();

  const cards = [
    {
      label: "Saldo total",
      value: formatCurrency(r.netWorth.liquid),
      icon: "Wallet",
      hint: "contas correntes",
      accent: "default" as const,
    },
    {
      label: "Património líquido",
      value: formatCurrency(r.netWorth.netWorth),
      icon: "TrendingUp",
      accent: "primary" as const,
      trend: { value: formatPercent(r.cashFlow.savingsRate), positive: r.cashFlow.net >= 0 },
    },
    {
      label: "Receitas (mês)",
      value: formatCurrency(r.cashFlow.monthIncome),
      icon: "ArrowDownRight",
      accent: "default" as const,
    },
    {
      label: "Despesas (mês)",
      value: formatCurrency(r.cashFlow.monthExpenses),
      icon: "ArrowUpRight",
      accent: "warning" as const,
    },
    {
      label: "Poupança",
      value: formatCurrency(r.netWorth.savings),
      icon: "PiggyBank",
      accent: "primary" as const,
    },
    {
      label: "Dívidas",
      value: formatCurrency(r.netWorth.totalDebt),
      icon: "TrendingDown",
      accent: r.netWorth.totalDebt > 0 ? ("danger" as const) : ("default" as const),
      hint: r.debts.monthsToDebtFree
        ? `${formatMonths(r.debts.monthsToDebtFree)} p/ zerar`
        : undefined,
    },
    {
      label: "Investimentos",
      value: formatCurrency(r.netWorth.investments),
      icon: "BarChart3",
      accent: "default" as const,
    },
    {
      label: "Capacidade planeada",
      value: formatCurrency(r.cashFlow.plannedCapacity),
      icon: "Banknote",
      accent: "primary" as const,
      hint: r.cashFlow.hasPlannedTarget
        ? `teórica ${formatCompact(r.cashFlow.theoreticalCapacity)}`
        : "para poupar/mês",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c, i) => (
        <StatCard key={c.label} index={i} {...c} />
      ))}
    </div>
  );
}
