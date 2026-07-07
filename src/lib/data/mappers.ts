/**
 * Mapeadores linha-da-BD → domínio.
 * O Supabase usa snake_case; o domínio usa camelCase. Coerção numérica defensiva.
 */

import type {
  BankAccount,
  Debt,
  Goal,
  Mission,
  RecurringPayment,
  Salary,
  Transaction,
  UserProfile,
} from "@/types/domain";
import type { CurrencyCode } from "@/lib/format";

const num = (v: unknown) => Number(v ?? 0);

export function mapProfile(row: any, fallbackEmail = ""): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name ?? fallbackEmail ?? "Utilizador",
    email: fallbackEmail,
    avatarUrl: row.avatar_url ?? undefined,
    baseCurrency: (row.base_currency ?? "AOA") as CurrencyCode,
    streak: num(row.streak),
  };
}

export function mapAccount(row: any): BankAccount {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    balance: num(row.balance),
    currency: (row.currency ?? "AOA") as CurrencyCode,
    icon: row.icon ?? "Landmark",
    color: row.color ?? "var(--chart-1)",
    targetBalance: row.target_balance != null ? num(row.target_balance) : undefined,
    createdAt: row.created_at?.slice(0, 10) ?? "",
  };
}

export function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    type: row.type,
    amount: num(row.amount),
    category: row.category,
    description: row.description ?? "",
    date: row.date,
    toAccountId: row.to_account_id ?? undefined,
    recurring: !!row.recurring,
  };
}

export function mapSalary(row: any): Salary {
  return {
    id: row.id,
    label: row.label,
    amount: num(row.amount),
    frequency: row.frequency,
    payDay: num(row.pay_day),
    accountId: row.account_id ?? "",
    active: !!row.active,
  };
}

export function mapDebt(row: any): Debt {
  return {
    id: row.id,
    creditor: row.creditor,
    totalAmount: num(row.total_amount),
    paidAmount: num(row.paid_amount),
    installments: num(row.installments),
    paidInstallments: num(row.paid_installments),
    dueDate: row.due_date ?? "",
    priority: row.priority,
    status: row.status,
  };
}

export function mapRecurring(row: any): RecurringPayment {
  return {
    id: row.id,
    label: row.label,
    kind: row.kind,
    category: row.category,
    amount: num(row.amount),
    dayOfMonth: num(row.day_of_month),
    active: !!row.active,
  };
}

export function mapGoal(row: any): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    targetAmount: num(row.target_amount),
    currentAmount: num(row.current_amount),
    deadline: row.deadline ?? undefined,
    status: row.status,
    monthlyContribution:
      row.monthly_contribution != null ? num(row.monthly_contribution) : undefined,
    color: row.color ?? "var(--chart-1)",
  };
}

export function mapPlan(row: any): import("@/types/domain").Plan {
  const tasks = Array.isArray(row.tasks) ? row.tasks : [];
  return {
    id: row.id,
    title: row.title,
    period: row.period ?? "Mensal",
    budget: num(row.budget),
    tasks: tasks.map((t: any) => ({
      id: String(t.id ?? ""),
      label: String(t.label ?? ""),
      done: !!t.done,
    })),
    createdAt: row.created_at?.slice(0, 10) ?? "",
  };
}

export function mapMission(row: any): Mission {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    targetAmount: row.target_amount != null ? num(row.target_amount) : undefined,
    deadline: row.deadline ?? undefined,
    status: row.status,
    isPrimary: !!row.is_primary,
    createdAt: row.created_at?.slice(0, 10) ?? "",
  };
}
