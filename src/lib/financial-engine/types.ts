/**
 * Tipos de saída do Motor Financeiro.
 * Tudo aqui é resultado de cálculo determinístico — NUNCA gerado por IA.
 * A IA recebe estes objetos já calculados e apenas os interpreta.
 */

import type { CategoryKey, Priority } from "@/types/domain";

export interface NetWorthReport {
  totalAssets: number;
  liquid: number; // contas correntes + carteira
  savings: number; // contas poupança
  investments: number; // contas de investimento
  totalDebt: number;
  netWorth: number;
  /** Rácio dívida/ativos (0..1). */
  debtRatio: number;
}

export interface CashFlowReport {
  monthIncome: number;
  monthExpenses: number;
  net: number;
  /** Taxa de poupança do mês (0..1). */
  savingsRate: number;
  /** Rendimento mensal recorrente esperado (salários normalizados). */
  expectedMonthlyIncome: number;
  /** Despesa recorrente fixa mensal. */
  fixedMonthlyExpenses: number;
  /** Capacidade de poupança mensal estimada. */
  monthlyCapacity: number;
}

export interface CategoryBreakdownItem {
  category: CategoryKey;
  amount: number;
  share: number; // 0..1 do total de despesas
  essential: boolean;
}

export interface BudgetReport {
  totalExpenses: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  essentialShare: number; // 0..1
  byCategory: CategoryBreakdownItem[];
  /** Estrutura 50/30/20 comparada com a realidade. */
  framework: {
    needsActual: number;
    wantsActual: number;
    savingsActual: number;
    needsTarget: number;
    wantsTarget: number;
    savingsTarget: number;
  };
}

export interface GoalProjection {
  id: string;
  title: string;
  progress: number; // 0..1
  remaining: number;
  monthlyContribution: number;
  monthsToComplete: number | null;
  projectedDate: string | null;
  onTrack: boolean;
}

export interface DebtProjection {
  totalOutstanding: number;
  totalPaid: number;
  paidShare: number; // 0..1
  byPriority: Record<Priority, number>;
  /** Ordem de pagamento sugerida (avalanche por prioridade + montante). */
  payoffOrder: { id: string; creditor: string; outstanding: number; priority: Priority }[];
  /** Meses para zerar dívidas dada a capacidade mensal. */
  monthsToDebtFree: number | null;
  reductionSeries: { date: string; outstanding: number }[];
}

export interface ForecastPoint {
  month: string; // "2026-07"
  netWorth: number;
  savings: number;
}

export interface ForecastReport {
  horizonMonths: number;
  points: ForecastPoint[];
  /** Património projetado no fim do horizonte. */
  projectedNetWorth: number;
  /** Poupança projetada no fim do horizonte. */
  projectedSavings: number;
}

export interface FinancialReport {
  generatedAt: string;
  netWorth: NetWorthReport;
  cashFlow: CashFlowReport;
  budget: BudgetReport;
  goals: GoalProjection[];
  debts: DebtProjection;
  forecast: ForecastReport;
  /** Saúde financeira agregada (0..100), determinística. */
  healthScore: number;
}

// ── Alocação de salário (Wizard "Recebi salário") ──────────────
export interface SalaryAllocationInput {
  received: number;
  debts: { id: string; creditor: string; outstanding: number; priority: Priority }[];
  recurring: { id: string; label: string; amount: number }[];
  savingsTarget: number; // quanto o utilizador quer guardar
}

export interface AllocationLine {
  bucket: "essenciais" | "dividas" | "poupanca" | "objetivos" | "livre";
  label: string;
  amount: number;
  share: number; // 0..1 do salário recebido
  detail?: string;
}

export interface SalaryAllocationResult {
  received: number;
  lines: AllocationLine[];
  totalEssentials: number;
  totalDebts: number;
  totalSavings: number;
  freeAmount: number;
  /** Resumo determinístico que a IA irá explicar em linguagem natural. */
  rationale: string[];
}

// ── Simulador de compras ───────────────────────────────────────
export type SimulationVerdict = "recomendado" | "cautela" | "evitar";

export interface PurchaseSimulationInput {
  amount: number;
  installments?: number; // 1 = à vista
  /** Categoria da despesa simulada. */
  category?: CategoryKey;
}

export interface PurchaseSimulationResult {
  amount: number;
  monthlyImpact: number;
  /** Impacto na poupança atual (valor e %). */
  savingsAfter: number;
  savingsImpactPct: number;
  /** Meses adicionais para atingir a missão/meta principal. */
  goalDelayMonths: number;
  /** Novo fluxo de caixa mensal após a compra. */
  cashFlowAfter: number;
  /** Mantém-se acima do fundo de emergência? */
  keepsEmergencyFund: boolean;
  verdict: SimulationVerdict;
  reasons: string[];
}
