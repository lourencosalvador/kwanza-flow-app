/**
 * Simulador de compras — determinístico.
 * Calcula o impacto de uma compra na poupança, fluxo de caixa, metas e previsão.
 * O veredito (recomendado/cautela/evitar) é calculado por regras; a IA explica.
 */

import type { FinancialReport, PurchaseSimulationInput, PurchaseSimulationResult } from "./types";

const round = (n: number) => Math.round(n);
const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

/** Fundo de emergência recomendado: 3× despesa mensal fixa. */
export function emergencyFundTarget(report: FinancialReport): number {
  return report.cashFlow.fixedMonthlyExpenses * 3;
}

export function simulatePurchase(
  input: PurchaseSimulationInput,
  report: FinancialReport,
): PurchaseSimulationResult {
  const installments = Math.max(1, input.installments ?? 1);
  const monthlyImpact = input.amount / installments;

  const savingsBefore = report.netWorth.savings;
  // À vista sai da poupança/liquidez; a prazo reduz capacidade mensal.
  const upfront = installments === 1 ? input.amount : 0;
  const savingsAfter = savingsBefore - upfront;
  const savingsImpactPct = safeDiv(input.amount, savingsBefore || input.amount);

  const cashFlowAfter = report.cashFlow.monthlyCapacity - monthlyImpact;

  const emergencyTarget = emergencyFundTarget(report);
  const keepsEmergencyFund = savingsAfter >= emergencyTarget;

  // Atraso na meta principal: quanto a compra "consome" da capacidade mensal.
  const capacity = report.cashFlow.monthlyCapacity;
  const goalDelayMonths =
    capacity > 0 ? Math.ceil(input.amount / capacity) : input.amount > 0 ? 99 : 0;

  // Regras de veredito.
  const reasons: string[] = [];
  let verdict: PurchaseSimulationResult["verdict"] = "recomendado";

  if (!keepsEmergencyFund) {
    verdict = "evitar";
    reasons.push(
      "A compra coloca a sua poupança abaixo do fundo de emergência recomendado (3 meses de despesas fixas).",
    );
  }
  if (cashFlowAfter < 0) {
    verdict = "evitar";
    reasons.push(
      "O pagamento mensal ultrapassa a sua capacidade de poupança e geraria fluxo de caixa negativo.",
    );
  }
  if (verdict !== "evitar" && goalDelayMonths >= 3) {
    verdict = "cautela";
    reasons.push(
      `Esta compra atrasaria a sua missão principal em cerca de ${goalDelayMonths} meses.`,
    );
  }
  if (verdict !== "evitar" && savingsImpactPct > 0.3) {
    verdict = "cautela";
    reasons.push(
      `Consome ${Math.round(savingsImpactPct * 100)}% da sua poupança atual.`,
    );
  }
  // Estratégia: gasto mensal acima da margem de segurança come a poupança planeada.
  if (
    verdict !== "evitar" &&
    report.cashFlow.hasPlannedTarget &&
    monthlyImpact > report.cashFlow.safetyBuffer
  ) {
    verdict = "cautela";
    reasons.push(
      "O custo mensal ultrapassa a sua margem de segurança livre e consumiria parte da poupança que planeou guardar.",
    );
  }
  if (reasons.length === 0) {
    reasons.push(
      "A compra cabe no seu orçamento, mantém o fundo de emergência e não compromete a missão principal.",
    );
  }

  return {
    amount: input.amount,
    monthlyImpact: round(monthlyImpact),
    savingsAfter: round(savingsAfter),
    savingsImpactPct,
    goalDelayMonths,
    cashFlowAfter: round(cashFlowAfter),
    keepsEmergencyFund,
    verdict,
    reasons,
  };
}
