/**
 * Alocação de salário — Passo 5 do Wizard "Recebi salário".
 * Determinístico. Decide para onde vai cada Kwanza. A IA apenas explica.
 *
 * Ordem de prioridade:
 *   1. Essenciais / pagamentos recorrentes (cobrir primeiro)
 *   2. Dívidas, por prioridade (crítica → baixa)
 *   3. Poupança / objetivos definidos pelo utilizador
 *   4. Montante livre (margem / discricionário)
 */

import type { Priority } from "@/types/domain";
import type { AllocationLine, SalaryAllocationInput, SalaryAllocationResult } from "./types";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  critica: 4,
  alta: 3,
  media: 2,
  baixa: 1,
};

const round = (n: number) => Math.round(n);

export function allocateSalary(input: SalaryAllocationInput): SalaryAllocationResult {
  const { received } = input;
  const lines: AllocationLine[] = [];
  const rationale: string[] = [];
  let remaining = received;

  // 1. Essenciais
  const totalEssentials = input.recurring.reduce((s, r) => s + r.amount, 0);
  const essentialsPaid = Math.min(remaining, totalEssentials);
  remaining -= essentialsPaid;
  if (essentialsPaid > 0) {
    lines.push({
      bucket: "essenciais",
      label: "Pagamentos essenciais",
      amount: round(essentialsPaid),
      share: essentialsPaid / received,
      detail: input.recurring.map((r) => r.label).join(", "),
    });
    rationale.push(
      `Reservei ${round(essentialsPaid).toLocaleString("pt-AO")} Kz para cobrir os pagamentos essenciais (${input.recurring.length} compromissos fixos) — estes vêm sempre primeiro para garantir estabilidade.`,
    );
    if (essentialsPaid < totalEssentials) {
      rationale.push(
        `Atenção: o salário não cobre a totalidade dos essenciais (faltam ${round(totalEssentials - essentialsPaid).toLocaleString("pt-AO")} Kz). Considere rever despesas fixas.`,
      );
    }
  }

  // 2. Dívidas por prioridade
  const sortedDebts = [...input.debts].sort(
    (a, b) =>
      PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] ||
      b.outstanding - a.outstanding,
  );
  // Até 40% do que sobra dos essenciais vai para dívidas (ajustado se houver crítica).
  const hasCritical = sortedDebts.some((d) => d.priority === "critica");
  const debtShare = hasCritical ? 0.55 : 0.4;
  let debtBudget = remaining * debtShare;
  let totalDebts = 0;
  for (const d of sortedDebts) {
    if (debtBudget <= 0) break;
    const pay = Math.min(debtBudget, d.outstanding);
    if (pay <= 0) continue;
    debtBudget -= pay;
    remaining -= pay;
    totalDebts += pay;
    lines.push({
      bucket: "dividas",
      label: `Dívida · ${d.creditor}`,
      amount: round(pay),
      share: pay / received,
      detail: `Prioridade ${d.priority}`,
    });
  }
  if (totalDebts > 0) {
    rationale.push(
      `Direcionei ${round(totalDebts).toLocaleString("pt-AO")} Kz para abater dívidas, começando pelas de maior prioridade${hasCritical ? " (há dívida crítica, por isso reforcei este valor)" : ""}. Reduzir dívida liberta fluxo de caixa futuro.`,
    );
  }

  // 3. Poupança / objetivos
  const savings = Math.min(remaining, Math.max(0, input.savingsTarget));
  remaining -= savings;
  let totalSavings = 0;
  if (savings > 0) {
    totalSavings = savings;
    lines.push({
      bucket: "poupanca",
      label: "Poupança & objetivos",
      amount: round(savings),
      share: savings / received,
      detail: "Pague-se a si primeiro",
    });
    rationale.push(
      `Guardei ${round(savings).toLocaleString("pt-AO")} Kz para a sua poupança/objetivos — é assim que se constrói património de forma consistente.`,
    );
  } else if (input.savingsTarget > 0) {
    rationale.push(
      "Não foi possível guardar o valor pretendido este mês após cobrir essenciais e dívidas. Reveja o objetivo de poupança ou as despesas fixas.",
    );
  }

  // 4. Livre
  const freeAmount = Math.max(0, remaining);
  if (freeAmount > 0) {
    lines.push({
      bucket: "livre",
      label: "Margem livre",
      amount: round(freeAmount),
      share: freeAmount / received,
      detail: "Disponível para lazer ou reforço de poupança",
    });
    rationale.push(
      `Sobram ${round(freeAmount).toLocaleString("pt-AO")} Kz de margem livre. Sugestão: reforce a poupança ou mantenha como folga para imprevistos.`,
    );
  }

  return {
    received,
    lines,
    totalEssentials: round(essentialsPaid),
    totalDebts: round(totalDebts),
    totalSavings: round(totalSavings),
    freeAmount: round(freeAmount),
    rationale,
  };
}
