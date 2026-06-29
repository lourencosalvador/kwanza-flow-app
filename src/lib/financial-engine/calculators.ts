/**
 * Calculadoras determinísticas do Motor Financeiro.
 * Funções puras: recebem dados, devolvem números. Sem efeitos colaterais, sem IA.
 */

import type {
  BankAccount,
  Debt,
  FinancialSnapshot,
  Goal,
  Priority,
  RecurringPayment,
  Salary,
  Transaction,
} from "@/types/domain";
import { getCategory } from "@/config/categories";
import type {
  BudgetReport,
  CashFlowReport,
  DebtProjection,
  ForecastReport,
  GoalProjection,
  NetWorthReport,
} from "./types";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  critica: 4,
  alta: 3,
  media: 2,
  baixa: 1,
};

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);
const round = (n: number) => Math.round(n);

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isSameMonth(iso: string, ref: Date) {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

/** Normaliza um salário para valor mensal equivalente. */
export function monthlySalary(salary: Salary): number {
  if (!salary.active) return 0;
  switch (salary.frequency) {
    case "semanal":
      return (salary.amount * 52) / 12;
    case "quinzenal":
      return (salary.amount * 26) / 12;
    case "mensal":
    case "personalizado":
    default:
      return salary.amount;
  }
}

// ── Património ──────────────────────────────────────────────────
export function calcNetWorth(
  accounts: BankAccount[],
  debts: Debt[],
): NetWorthReport {
  const liquid = accounts
    .filter((a) => a.kind === "corrente" || a.kind === "carteira")
    .reduce((s, a) => s + a.balance, 0);
  const savings = accounts
    .filter((a) => a.kind === "poupanca")
    .reduce((s, a) => s + a.balance, 0);
  const investments = accounts
    .filter((a) => a.kind === "investimento")
    .reduce((s, a) => s + a.balance, 0);

  const totalAssets = liquid + savings + investments;
  const totalDebt = debts
    .filter((d) => d.status !== "pago")
    .reduce((s, d) => s + Math.max(0, d.totalAmount - d.paidAmount), 0);

  return {
    totalAssets: round(totalAssets),
    liquid: round(liquid),
    savings: round(savings),
    investments: round(investments),
    totalDebt: round(totalDebt),
    netWorth: round(totalAssets - totalDebt),
    debtRatio: safeDiv(totalDebt, totalAssets),
  };
}

// ── Fluxo de caixa ──────────────────────────────────────────────
export function calcCashFlow(
  transactions: Transaction[],
  salaries: Salary[],
  recurring: RecurringPayment[],
  ref: Date = new Date(),
): CashFlowReport {
  const monthTx = transactions.filter((t) => isSameMonth(t.date, ref));
  const monthIncome = monthTx
    .filter((t) => t.type === "receita")
    .reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTx
    .filter((t) => t.type === "despesa")
    .reduce((s, t) => s + t.amount, 0);

  const expectedMonthlyIncome = salaries.reduce(
    (s, sal) => s + monthlySalary(sal),
    0,
  );
  const fixedMonthlyExpenses = recurring
    .filter((r) => r.active)
    .reduce((s, r) => s + r.amount, 0);

  const net = monthIncome - monthExpenses;
  const monthlyCapacity = expectedMonthlyIncome - fixedMonthlyExpenses;

  return {
    monthIncome: round(monthIncome),
    monthExpenses: round(monthExpenses),
    net: round(net),
    savingsRate: safeDiv(net, monthIncome || expectedMonthlyIncome),
    expectedMonthlyIncome: round(expectedMonthlyIncome),
    fixedMonthlyExpenses: round(fixedMonthlyExpenses),
    monthlyCapacity: round(monthlyCapacity),
  };
}

// ── Orçamento ───────────────────────────────────────────────────
export function calcBudget(
  transactions: Transaction[],
  income: number,
  ref: Date = new Date(),
): BudgetReport {
  const expenses = transactions.filter(
    (t) => t.type === "despesa" && isSameMonth(t.date, ref),
  );
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

  const byCategoryMap = new Map<string, number>();
  for (const t of expenses) {
    byCategoryMap.set(t.category, (byCategoryMap.get(t.category) ?? 0) + t.amount);
  }

  const byCategory = Array.from(byCategoryMap.entries())
    .map(([category, amount]) => ({
      category: category as BudgetReport["byCategory"][number]["category"],
      amount: round(amount),
      share: safeDiv(amount, totalExpenses),
      essential: getCategory(category as never).essential,
    }))
    .sort((a, b) => b.amount - a.amount);

  const essentialExpenses = byCategory
    .filter((c) => c.essential)
    .reduce((s, c) => s + c.amount, 0);
  const discretionaryExpenses = totalExpenses - essentialExpenses;
  const savingsActual = Math.max(0, income - totalExpenses);

  return {
    totalExpenses: round(totalExpenses),
    essentialExpenses: round(essentialExpenses),
    discretionaryExpenses: round(discretionaryExpenses),
    essentialShare: safeDiv(essentialExpenses, totalExpenses),
    byCategory,
    framework: {
      needsActual: round(essentialExpenses),
      wantsActual: round(discretionaryExpenses),
      savingsActual: round(savingsActual),
      needsTarget: round(income * 0.5),
      wantsTarget: round(income * 0.3),
      savingsTarget: round(income * 0.2),
    },
  };
}

// ── Metas ───────────────────────────────────────────────────────
export function projectGoals(
  goals: Goal[],
  monthlyCapacity: number,
  ref: Date = new Date(),
): GoalProjection[] {
  const active = goals.filter((g) => g.status !== "pausada");
  return active.map((g) => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    const contribution =
      g.monthlyContribution && g.monthlyContribution > 0
        ? g.monthlyContribution
        : Math.max(0, monthlyCapacity / Math.max(1, active.length));
    const monthsToComplete =
      remaining <= 0 ? 0 : contribution > 0 ? Math.ceil(remaining / contribution) : null;

    let projectedDate: string | null = null;
    let onTrack = false;
    if (monthsToComplete !== null) {
      const d = new Date(ref);
      d.setMonth(d.getMonth() + monthsToComplete);
      projectedDate = d.toISOString().slice(0, 10);
      onTrack = g.deadline ? new Date(projectedDate) <= new Date(g.deadline) : true;
    }

    return {
      id: g.id,
      title: g.title,
      progress: safeDiv(g.currentAmount, g.targetAmount),
      remaining: round(remaining),
      monthlyContribution: round(contribution),
      monthsToComplete,
      projectedDate,
      onTrack,
    };
  });
}

// ── Dívidas ─────────────────────────────────────────────────────
export function projectDebts(
  debts: Debt[],
  monthlyCapacity: number,
  ref: Date = new Date(),
): DebtProjection {
  const open = debts.filter((d) => d.status !== "pago");
  const totalOutstanding = open.reduce(
    (s, d) => s + Math.max(0, d.totalAmount - d.paidAmount),
    0,
  );
  const totalPaid = debts.reduce((s, d) => s + d.paidAmount, 0);
  const grandTotal = debts.reduce((s, d) => s + d.totalAmount, 0);

  const byPriority: Record<Priority, number> = {
    critica: 0,
    alta: 0,
    media: 0,
    baixa: 0,
  };
  for (const d of open) {
    byPriority[d.priority] += Math.max(0, d.totalAmount - d.paidAmount);
  }

  // Estratégia avalanche: prioridade desc, depois montante desc.
  const payoffOrder = open
    .map((d) => ({
      id: d.id,
      creditor: d.creditor,
      outstanding: round(Math.max(0, d.totalAmount - d.paidAmount)),
      priority: d.priority,
    }))
    .sort(
      (a, b) =>
        PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] ||
        b.outstanding - a.outstanding,
    );

  // Capacidade dedicável a dívidas: ~40% da capacidade mensal.
  const debtBudget = Math.max(0, monthlyCapacity * 0.4);
  const monthsToDebtFree =
    totalOutstanding <= 0 ? 0 : debtBudget > 0 ? Math.ceil(totalOutstanding / debtBudget) : null;

  // Série de redução projetada (12 meses).
  const reductionSeries: { date: string; outstanding: number }[] = [];
  let remaining = totalOutstanding;
  for (let i = 0; i <= 12 && remaining >= 0; i++) {
    const d = new Date(ref);
    d.setMonth(d.getMonth() + i);
    reductionSeries.push({ date: monthKey(d), outstanding: round(remaining) });
    remaining = Math.max(0, remaining - debtBudget);
    if (remaining === 0 && i > 0) break;
  }

  return {
    totalOutstanding: round(totalOutstanding),
    totalPaid: round(totalPaid),
    paidShare: safeDiv(totalPaid, grandTotal),
    byPriority,
    payoffOrder,
    monthsToDebtFree,
    reductionSeries,
  };
}

// ── Previsão ────────────────────────────────────────────────────
export function forecast(
  startNetWorth: number,
  startSavings: number,
  monthlyCapacity: number,
  horizonMonths = 6,
  ref: Date = new Date(),
): ForecastReport {
  const points = [];
  let netWorth = startNetWorth;
  let savings = startSavings;
  for (let i = 0; i <= horizonMonths; i++) {
    const d = new Date(ref);
    d.setMonth(d.getMonth() + i);
    points.push({
      month: monthKey(d),
      netWorth: round(netWorth),
      savings: round(savings),
    });
    netWorth += monthlyCapacity;
    savings += Math.max(0, monthlyCapacity);
  }
  return {
    horizonMonths,
    points,
    projectedNetWorth: points[points.length - 1].netWorth,
    projectedSavings: points[points.length - 1].savings,
  };
}

/** Saúde financeira agregada (0..100) — composição ponderada determinística. */
export function calcHealthScore(args: {
  savingsRate: number;
  debtRatio: number;
  hasEmergencyFund: boolean;
  goalsOnTrackShare: number;
}): number {
  const { savingsRate, debtRatio, hasEmergencyFund, goalsOnTrackShare } = args;
  const savingsScore = Math.min(1, Math.max(0, savingsRate / 0.2)) * 35;
  const debtScore = (1 - Math.min(1, debtRatio)) * 30;
  const emergencyScore = hasEmergencyFund ? 20 : 0;
  const goalsScore = Math.min(1, Math.max(0, goalsOnTrackShare)) * 15;
  return round(savingsScore + debtScore + emergencyScore + goalsScore);
}

export { isSameMonth, monthKey };
