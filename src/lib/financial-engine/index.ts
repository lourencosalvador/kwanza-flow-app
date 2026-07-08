/**
 * Motor Financeiro — ponto de entrada.
 *
 * `analyze(snapshot)` produz um relatório financeiro completo e determinístico
 * a partir do snapshot de dados do utilizador. Este relatório é a ÚNICA fonte
 * de números do sistema — o frontend lê daqui e a IA interpreta daqui.
 *
 * REGRA DE OURO: a IA nunca calcula. O motor calcula, a IA explica.
 */

import type { FinancialSnapshot } from "@/types/domain";
import {
  calcBudget,
  calcCashFlow,
  calcHealthScore,
  calcNetWorth,
  forecast,
  projectDebts,
  projectGoals,
} from "./calculators";
import type { FinancialReport } from "./types";

export function analyze(
  snapshot: FinancialSnapshot,
  ref: Date = new Date(),
): FinancialReport {
  const { accounts, transactions, salaries, debts, recurring, goals } = snapshot;

  const netWorth = calcNetWorth(accounts, debts);
  const cashFlow = calcCashFlow(
    transactions,
    salaries,
    recurring,
    ref,
    snapshot.profile.strategy,
  );
  const budget = calcBudget(
    transactions,
    cashFlow.monthIncome || cashFlow.expectedMonthlyIncome,
    ref,
  );
  const goalProjections = projectGoals(goals, cashFlow.monthlyCapacity, ref);
  const debtProjection = projectDebts(debts, cashFlow.monthlyCapacity, ref);
  const forecastReport = forecast(
    netWorth.netWorth,
    netWorth.savings,
    cashFlow.monthlyCapacity,
    6,
    ref,
  );

  // Sem metas → 0 (não há progresso a avaliar), não 100%.
  const goalsOnTrackShare =
    goalProjections.length === 0
      ? 0
      : goalProjections.filter((g) => g.onTrack).length / goalProjections.length;

  const hasFinancialData =
    netWorth.totalAssets > 0 ||
    netWorth.totalDebt > 0 ||
    cashFlow.expectedMonthlyIncome > 0 ||
    cashFlow.monthIncome > 0;

  const healthScore = calcHealthScore({
    savingsRate: cashFlow.savingsRate,
    debtRatio: netWorth.debtRatio,
    savings: netWorth.savings,
    fixedMonthlyExpenses: cashFlow.fixedMonthlyExpenses,
    hasFinancialData,
    goalsOnTrackShare,
  });

  return {
    generatedAt: ref.toISOString(),
    netWorth,
    cashFlow,
    budget,
    goals: goalProjections,
    debts: debtProjection,
    forecast: forecastReport,
    healthScore,
  };
}

export * from "./types";
export * from "./calculators";
export { allocateSalary } from "./salary";
export { simulatePurchase, emergencyFundTarget } from "./simulator";
