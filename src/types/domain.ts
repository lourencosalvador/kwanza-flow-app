/**
 * Modelo de domínio do KwanzaFlow.
 * Estes tipos são partilhados entre o Motor Financeiro, as features e a IA.
 * Espelham as tabelas do Supabase (ver supabase/migrations).
 */

import type { CurrencyCode } from "@/lib/format";

export type ISODate = string; // "2026-06-27"
export type UUID = string;

export type Priority = "baixa" | "media" | "alta" | "critica";

export type CategoryKey =
  | "casa"
  | "renda"
  | "alimentacao"
  | "saude"
  | "internet"
  | "energia"
  | "agua"
  | "empregada"
  | "familia"
  | "lazer"
  | "educacao"
  | "investimentos"
  | "transporte"
  | "outros";

export interface Category {
  key: CategoryKey;
  label: string;
  icon: string; // nome do ícone lucide
  color: string; // token de cor (chart-1..5) ou hex
  /** Despesa essencial (renda, energia…) vs. discricionária (lazer…). */
  essential: boolean;
}

export type AccountKind = "corrente" | "poupanca" | "investimento" | "carteira";

export interface BankAccount {
  id: UUID;
  name: string; // "BAI", "BFA", "Atlantico"
  kind: AccountKind;
  balance: number;
  currency: CurrencyCode;
  icon: string;
  color: string; // token chart-* ou hex
  /** Objetivo de saldo opcional para a conta. */
  targetBalance?: number;
  createdAt: ISODate;
}

export type TransactionType = "receita" | "despesa" | "transferencia";

export interface Transaction {
  id: UUID;
  accountId: UUID;
  type: TransactionType;
  amount: number; // sempre positivo; o `type` define o sinal
  category: CategoryKey;
  description: string;
  date: ISODate;
  /** Conta de destino, quando type === "transferencia". */
  toAccountId?: UUID;
  recurring?: boolean;
}

export type SalaryFrequency = "semanal" | "quinzenal" | "mensal" | "personalizado";

export interface Salary {
  id: UUID;
  label: string; // "Salário principal"
  amount: number;
  frequency: SalaryFrequency;
  /** Dia do mês do recebimento (1-31) para frequência mensal. */
  payDay: number;
  accountId: UUID;
  active: boolean;
}

export type DebtStatus = "pendente" | "parcial" | "pago";

export interface Debt {
  id: UUID;
  creditor: string; // pessoa ou instituição
  totalAmount: number;
  paidAmount: number;
  installments: number;
  paidInstallments: number;
  dueDate: ISODate;
  priority: Priority;
  status: DebtStatus;
  /** Histórico de pagamentos para o gráfico de redução. */
  history?: { date: ISODate; amount: number }[];
}

export type RecurringKind =
  | "renda"
  | "internet"
  | "energia"
  | "agua"
  | "empregada"
  | "subscricao"
  | "outros";

export interface RecurringPayment {
  id: UUID;
  label: string;
  kind: RecurringKind;
  category: CategoryKey;
  amount: number;
  dayOfMonth: number; // dia de vencimento
  active: boolean;
}

export type GoalStatus = "ativa" | "concluida" | "pausada";

export interface Goal {
  id: UUID;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: ISODate;
  status: GoalStatus;
  /** Contribuição mensal planeada para esta meta. */
  monthlyContribution?: number;
  color: string;
}

export type MissionKind =
  | "eliminar_dividas"
  | "poupar"
  | "comprar"
  | "investir"
  | "negocio";

export type MissionStatus = "ativa" | "concluida" | "arquivada";

export interface Mission {
  id: UUID;
  title: string; // "Guardar 3 milhões"
  kind: MissionKind;
  targetAmount?: number;
  deadline?: ISODate;
  status: MissionStatus;
  /** A missão "norte" que a IA acompanha em todo o sistema. */
  isPrimary: boolean;
  createdAt: ISODate;
}

export interface PlanTask {
  id: string;
  label: string;
  done: boolean;
}

export interface Plan {
  id: UUID;
  title: string; // "Plano Julho", "Plano Viagem"
  period: string; // "Mensal", "Objetivo", "Longo prazo"
  budget: number;
  tasks: PlanTask[];
  createdAt: ISODate;
}

export type TimelineEventKind =
  | "salario"
  | "divida_quitada"
  | "fundo_emergencia"
  | "marco"
  | "meta_atingida"
  | "missao";

export interface TimelineEvent {
  id: UUID;
  kind: TimelineEventKind;
  title: string;
  description?: string;
  amount?: number;
  date: ISODate;
}

export type AchievementId =
  | "primeira_poupanca"
  | "cem_mil"
  | "quinhentos_mil"
  | "um_milhao"
  | "mes_sem_emprestimos"
  | "meta_concluida"
  | "sequencia_registos";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: ISODate;
  /** 0..1 progresso até desbloquear. */
  progress: number;
}

export type NotificationLevel = "info" | "sucesso" | "aviso" | "perigo";

export interface SmartNotification {
  id: UUID;
  level: NotificationLevel;
  title: string;
  body: string;
  date: ISODate;
  read: boolean;
  /** Rota para a qual a notificação aponta. */
  href?: string;
}

/**
 * Estratégia financeira definida pelo utilizador (dinâmica, opcional).
 * Se `monthlySavingsTarget` for null, o sistema usa a capacidade teórica.
 */
export interface UserStrategy {
  /** Capacidade PLANEADA: quanto o utilizador decide guardar por mês. */
  monthlySavingsTarget: number | null;
  /** Reservar a diferença (teórica − planeada) como margem de segurança. */
  emergencyBufferEnabled: boolean;
  /** Priorizar a missão principal nas recomendações da IA. */
  optimizeForGoal: boolean;
}

export const DEFAULT_STRATEGY: UserStrategy = {
  monthlySavingsTarget: null,
  emergencyBufferEnabled: true,
  optimizeForGoal: true,
};

export interface UserProfile {
  id: UUID;
  fullName: string;
  email: string;
  avatarUrl?: string;
  baseCurrency: CurrencyCode;
  /** Streak de registos consecutivos (gamificação). */
  streak: number;
  /** Estratégia financeira do utilizador. */
  strategy: UserStrategy;
}

/** Snapshot completo dos dados do utilizador entregue ao Motor Financeiro. */
export interface FinancialSnapshot {
  profile: UserProfile;
  accounts: BankAccount[];
  transactions: Transaction[];
  salaries: Salary[];
  debts: Debt[];
  recurring: RecurringPayment[];
  goals: Goal[];
  missions: Mission[];
  plans: Plan[];
}
