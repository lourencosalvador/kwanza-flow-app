/**
 * Constrói o bloco de contexto entregue à IA.
 * Apenas dados JÁ PROCESSADOS pelo Motor Financeiro entram aqui.
 */

import { formatCurrency, formatMonths, formatPercent } from "@/lib/format";
import type { FinancialReport } from "@/lib/financial-engine/types";
import type { Mission } from "@/types/domain";

export interface AdvisorContextInput {
  userName: string;
  report: FinancialReport;
  missions: Mission[];
}

export function buildContextBlock({
  userName,
  report,
  missions,
}: AdvisorContextInput): string {
  const { netWorth, cashFlow, budget, goals, debts, forecast, healthScore } =
    report;
  const primary = missions.find((m) => m.isPrimary && m.status === "ativa");

  const lines: string[] = [];
  lines.push(`Utilizador: ${userName}`);
  lines.push(`Saúde financeira: ${healthScore}/100`);

  lines.push("");
  lines.push("PATRIMÓNIO:");
  lines.push(`- Património líquido: ${formatCurrency(netWorth.netWorth)}`);
  lines.push(`- Ativos totais: ${formatCurrency(netWorth.totalAssets)} (líquido ${formatCurrency(netWorth.liquid)}, poupança ${formatCurrency(netWorth.savings)}, investimentos ${formatCurrency(netWorth.investments)})`);
  lines.push(`- Dívida total: ${formatCurrency(netWorth.totalDebt)} (rácio dívida/ativos ${formatPercent(netWorth.debtRatio)})`);

  lines.push("");
  lines.push("FLUXO DE CAIXA (mês corrente):");
  lines.push(`- Receitas: ${formatCurrency(cashFlow.monthIncome)}`);
  lines.push(`- Despesas: ${formatCurrency(cashFlow.monthExpenses)}`);
  lines.push(`- Saldo do mês: ${formatCurrency(cashFlow.net)} (taxa de poupança ${formatPercent(cashFlow.savingsRate)})`);
  lines.push(`- Rendimento mensal esperado: ${formatCurrency(cashFlow.expectedMonthlyIncome)}`);
  lines.push(`- Despesa fixa mensal: ${formatCurrency(cashFlow.fixedMonthlyExpenses)}`);
  lines.push(`- Capacidade de poupança mensal: ${formatCurrency(cashFlow.monthlyCapacity)}`);

  lines.push("");
  lines.push("ORÇAMENTO (despesas por categoria, top 5):");
  budget.byCategory.slice(0, 5).forEach((c) => {
    lines.push(`- ${c.category}: ${formatCurrency(c.amount)} (${formatPercent(c.share)}${c.essential ? ", essencial" : ""})`);
  });
  lines.push(`- Essenciais: ${formatCurrency(budget.essentialExpenses)} | Discricionário: ${formatCurrency(budget.discretionaryExpenses)}`);

  lines.push("");
  lines.push("DÍVIDAS:");
  lines.push(`- Em aberto: ${formatCurrency(debts.totalOutstanding)} | Já pago: ${formatCurrency(debts.totalPaid)} (${formatPercent(debts.paidShare)})`);
  lines.push(`- Tempo para ficar sem dívidas (capacidade atual): ${formatMonths(debts.monthsToDebtFree)}`);
  if (debts.payoffOrder.length) {
    lines.push(`- Ordem de pagamento sugerida: ${debts.payoffOrder.map((d) => `${d.creditor} (${formatCurrency(d.outstanding)}, ${d.priority})`).join(" → ")}`);
  }

  lines.push("");
  lines.push("METAS:");
  goals.forEach((g) => {
    lines.push(`- ${g.title}: ${formatPercent(g.progress)} concluído, faltam ${formatCurrency(g.remaining)}, ~${formatMonths(g.monthsToComplete)}${g.onTrack ? " (no bom caminho)" : " (atrasada)"}`);
  });

  lines.push("");
  lines.push("PREVISÃO:");
  lines.push(`- Em ${forecast.horizonMonths} meses: património ~${formatCurrency(forecast.projectedNetWorth)}, poupança ~${formatCurrency(forecast.projectedSavings)}`);

  lines.push("");
  lines.push("MISSÃO PRINCIPAL:");
  if (primary) {
    lines.push(`- ${primary.title}${primary.targetAmount ? ` (alvo ${formatCurrency(primary.targetAmount)})` : ""}${primary.deadline ? `, prazo ${primary.deadline}` : ""}`);
  } else {
    lines.push("- Sem missão principal definida.");
  }

  return lines.join("\n");
}
