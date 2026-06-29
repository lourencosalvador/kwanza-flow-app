/**
 * Consultor local (fallback determinístico).
 * Usado quando OPENAI_API_KEY não está configurada — gera respostas úteis e
 * fundamentadas a partir do relatório do Motor Financeiro, sem chamar a OpenAI.
 * Mantém a promessa "sempre baseado em dados reais".
 */

import { formatCurrency, formatPercent } from "@/lib/format";
import type { FinancialReport } from "@/lib/financial-engine/types";
import type { Mission } from "@/types/domain";

function detectAmount(q: string): number | null {
  const m = q.replace(/\s|\./g, "").match(/(\d{4,})/);
  return m ? Number(m[1]) : null;
}

export function localAdvice(
  question: string,
  report: FinancialReport,
  missions: Mission[],
  userName: string,
): string {
  const q = question.toLowerCase();
  const { netWorth, cashFlow, budget, goals, debts, forecast } = report;
  const primary = missions.find((m) => m.isPrimary && m.status === "ativa");

  // Posso comprar / gastar X?
  if (/(posso comprar|posso gastar|comprar isto|compro)/.test(q)) {
    const amount = detectAmount(q);
    if (amount) {
      const fits = amount <= cashFlow.monthlyCapacity;
      const savingsImpact = formatPercent(amount / Math.max(1, netWorth.savings));
      return `Com base nos seus dados: a sua capacidade de poupança mensal é ${formatCurrency(cashFlow.monthlyCapacity)}. Uma compra de ${formatCurrency(amount)} ${fits ? "cabe no seu mês sem comprometer o essencial" : "ultrapassa a sua margem mensal — sairia da poupança"} e representa ${savingsImpact} da sua poupança atual. ${primary ? `Lembre-se da missão "${primary.title}": ${fits ? "esta compra não a compromete significativamente." : "esta compra afasta-o dela."}` : ""} Sugiro usar o Simulador para ver o impacto completo.`;
    }
    return `Diga-me o valor e eu avalio com os seus números reais. Hoje a sua capacidade de poupança mensal é ${formatCurrency(cashFlow.monthlyCapacity)} e a poupança disponível é ${formatCurrency(netWorth.savings)}.`;
  }

  // Quanto posso gastar?
  if (/(quanto posso gastar|quanto sobra|margem)/.test(q)) {
    return `Depois de cobrir as despesas fixas (${formatCurrency(cashFlow.fixedMonthlyExpenses)}), a sua margem mensal é ${formatCurrency(cashFlow.monthlyCapacity)}. Para se manter no bom caminho, sugiro guardar pelo menos 20% e usar o resto com consciência.`;
  }

  // Quando atinjo a meta?
  if (/(quando atinjo|quando alcanço|minha meta|atingir a meta)/.test(q)) {
    if (goals.length) {
      const g = goals[0];
      return `A meta "${g.title}" está ${formatPercent(g.progress)} concluída. Faltam ${formatCurrency(g.remaining)} e, ao ritmo de ${formatCurrency(g.monthlyContribution)}/mês, atinge-a em cerca de ${g.monthsToComplete ?? "—"} meses${g.projectedDate ? ` (≈ ${g.projectedDate})` : ""}. ${g.onTrack ? "Está dentro do prazo. 👏" : "Para cumprir o prazo, terá de reforçar a contribuição mensal."}`;
    }
    return "Ainda não tem metas definidas. Crie uma na secção Metas e eu projeto a data de conclusão.";
  }

  // Estou a gastar muito?
  if (/(gastando muito|gasto muito|gastar muito|a gastar muito)/.test(q)) {
    const top = budget.byCategory[0];
    return `As suas despesas do mês somam ${formatCurrency(budget.totalExpenses)}, das quais ${formatPercent(budget.essentialShare)} são essenciais. ${top ? `A maior categoria é "${top.category}" com ${formatCurrency(top.amount)} (${formatPercent(top.share)}).` : ""} A sua taxa de poupança é ${formatPercent(cashFlow.savingsRate)} — ${cashFlow.savingsRate >= 0.2 ? "saudável." : "abaixo dos 20% recomendados; vale a pena cortar no discricionário."}`;
  }

  // Onde economizar?
  if (/(economizar|poupar mais|cortar|reduzir despesa)/.test(q)) {
    const discretionary = budget.byCategory.filter((c) => !c.essential).slice(0, 2);
    const targets = discretionary.map((c) => `${c.category} (${formatCurrency(c.amount)})`).join(" e ");
    return `O maior potencial de poupança está nas despesas discricionárias: ${formatCurrency(budget.discretionaryExpenses)} este mês. Comece por ${targets || "as categorias não essenciais"}. Cortar 30% aqui aproximaria-o da sua missão mais depressa.`;
  }

  // Daqui a 6 meses
  if (/(seis meses|6 meses|daqui a|futuro|previsão)/.test(q)) {
    return `Mantendo o ritmo atual (capacidade de ${formatCurrency(cashFlow.monthlyCapacity)}/mês), em ${forecast.horizonMonths} meses deverá ter um património de ${formatCurrency(forecast.projectedNetWorth)} e poupança de ${formatCurrency(forecast.projectedSavings)}.`;
  }

  // Como eliminar dívidas
  if (/(dívida|divida|emprést|emprest|eliminar dívidas)/.test(q)) {
    if (debts.totalOutstanding <= 0) return "Boas notícias: não tem dívidas em aberto. 🎉 Mantenha o foco em construir património.";
    const order = debts.payoffOrder.map((d) => d.creditor).join(" → ");
    return `Tem ${formatCurrency(debts.totalOutstanding)} em dívidas. Estratégia recomendada (avalanche por prioridade): ${order}. Dedicando ~40% da sua margem mensal, fica sem dívidas em cerca de ${debts.monthsToDebtFree ?? "—"} meses. Cada Kwanza abatido liberta fluxo de caixa futuro.`;
  }

  // Resumo geral / saudação
  return `Olá, ${userName.split(" ")[0]}. Aqui está o seu retrato atual: património ${formatCurrency(netWorth.netWorth)}, poupança ${formatCurrency(netWorth.savings)}, dívidas ${formatCurrency(netWorth.totalDebt)} e capacidade de poupança ${formatCurrency(cashFlow.monthlyCapacity)}/mês. A sua saúde financeira está em ${report.healthScore}/100. ${primary ? `Missão ativa: "${primary.title}".` : ""} Pergunte-me, por exemplo, "posso comprar X?", "onde posso economizar?" ou "quando atinjo a minha meta?".`;
}
