"use server";

/**
 * Server Actions — leitura e escrita no Supabase.
 * O user_id vem SEMPRE da sessão (auth.getUser), nunca do cliente.
 * RLS garante isolamento por utilizador.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  BankAccount,
  Debt,
  FinancialSnapshot,
  Goal,
  Mission,
  Transaction,
} from "@/types/domain";
import {
  mapAccount,
  mapDebt,
  mapGoal,
  mapMission,
  mapProfile,
  mapRecurring,
  mapSalary,
  mapTransaction,
} from "@/lib/data/mappers";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Carrega o snapshot completo do utilizador autenticado. */
export async function fetchSnapshot(): Promise<FinancialSnapshot | null> {
  const { supabase, user } = await ctx();
  if (!user) return null;

  const [profileRes, accounts, transactions, salaries, debts, recurring, goals, missions] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("accounts").select("*").order("created_at"),
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("salaries").select("*"),
      supabase.from("debts").select("*"),
      supabase.from("recurring_payments").select("*"),
      supabase.from("goals").select("*"),
      supabase.from("missions").select("*").order("created_at"),
    ]);

  return {
    profile: mapProfile(profileRes.data ?? { id: user.id }, user.email ?? ""),
    accounts: (accounts.data ?? []).map(mapAccount),
    transactions: (transactions.data ?? []).map(mapTransaction),
    salaries: (salaries.data ?? []).map(mapSalary),
    debts: (debts.data ?? []).map(mapDebt),
    recurring: (recurring.data ?? []).map(mapRecurring),
    goals: (goals.data ?? []).map(mapGoal),
    missions: (missions.data ?? []).map(mapMission),
  };
}

export async function createAccount(
  input: Omit<BankAccount, "id" | "createdAt">,
): Promise<void> {
  const { supabase, user } = await ctx();
  if (!user) return;
  await supabase.from("accounts").insert({
    user_id: user.id,
    name: input.name,
    kind: input.kind,
    balance: input.balance,
    currency: input.currency,
    icon: input.icon,
    color: input.color,
    target_balance: input.targetBalance ?? null,
  });
}

export async function createTransaction(input: Omit<Transaction, "id">): Promise<void> {
  const { supabase, user } = await ctx();
  if (!user) return;
  await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: input.accountId,
    type: input.type,
    amount: input.amount,
    category: input.category,
    description: input.description,
    date: input.date,
    to_account_id: input.toAccountId ?? null,
    recurring: input.recurring ?? false,
  });
  // Atualiza saldo da conta.
  const delta = input.type === "receita" ? input.amount : -input.amount;
  await adjustBalance(input.accountId, delta);
}

export async function createDebt(
  input: Omit<Debt, "id" | "paidAmount" | "paidInstallments" | "status" | "history">,
): Promise<void> {
  const { supabase, user } = await ctx();
  if (!user) return;
  await supabase.from("debts").insert({
    user_id: user.id,
    creditor: input.creditor,
    total_amount: input.totalAmount,
    paid_amount: 0,
    installments: input.installments,
    paid_installments: 0,
    due_date: input.dueDate || null,
    priority: input.priority,
    status: "pendente",
  });
}

export async function createGoal(
  input: Omit<Goal, "id" | "currentAmount" | "status">,
): Promise<void> {
  const { supabase, user } = await ctx();
  if (!user) return;
  await supabase.from("goals").insert({
    user_id: user.id,
    title: input.title,
    description: input.description ?? null,
    target_amount: input.targetAmount,
    current_amount: 0,
    deadline: input.deadline || null,
    status: "ativa",
    monthly_contribution: input.monthlyContribution ?? null,
    color: input.color,
  });
}

export async function contributeGoal(goalId: string, amount: number): Promise<void> {
  const { supabase, user } = await ctx();
  if (!user) return;
  const { data } = await supabase
    .from("goals")
    .select("current_amount,target_amount")
    .eq("id", goalId)
    .maybeSingle();
  if (!data) return;
  const current = Math.min(Number(data.target_amount), Number(data.current_amount) + amount);
  await supabase
    .from("goals")
    .update({
      current_amount: current,
      status: current >= Number(data.target_amount) ? "concluida" : "ativa",
    })
    .eq("id", goalId);
}

export async function createMission(
  input: Omit<Mission, "id" | "createdAt" | "status">,
): Promise<void> {
  const { supabase, user } = await ctx();
  if (!user) return;
  if (input.isPrimary) {
    await supabase.from("missions").update({ is_primary: false }).eq("user_id", user.id);
  }
  await supabase.from("missions").insert({
    user_id: user.id,
    title: input.title,
    kind: input.kind,
    target_amount: input.targetAmount ?? null,
    deadline: input.deadline || null,
    status: "ativa",
    is_primary: input.isPrimary,
  });
}

export async function setPrimaryMission(missionId: string): Promise<void> {
  const { supabase, user } = await ctx();
  if (!user) return;
  await supabase.from("missions").update({ is_primary: false }).eq("user_id", user.id);
  await supabase.from("missions").update({ is_primary: true }).eq("id", missionId);
}

export async function applySalaryServer(params: {
  received: number;
  savings: number;
  primaryAccountId: string;
  savingsAccountId: string;
  debtPayments: { id: string; amount: number }[];
  date: string;
}): Promise<void> {
  const { supabase, user } = await ctx();
  if (!user) return;

  // 1. Transação de receita.
  await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: params.primaryAccountId,
    type: "receita",
    amount: params.received,
    category: "outros",
    description: "Salário recebido",
    date: params.date,
    recurring: true,
  });

  // 2. Saldos.
  const movesToSavings =
    params.savings > 0 && params.savingsAccountId !== params.primaryAccountId;
  await adjustBalance(
    params.primaryAccountId,
    params.received - (movesToSavings ? params.savings : 0),
  );
  if (movesToSavings) await adjustBalance(params.savingsAccountId, params.savings);

  // 3. Dívidas.
  for (const p of params.debtPayments) {
    const { data } = await supabase
      .from("debts")
      .select("total_amount,paid_amount")
      .eq("id", p.id)
      .maybeSingle();
    if (!data) continue;
    const paid = Math.min(Number(data.total_amount), Number(data.paid_amount) + p.amount);
    await supabase
      .from("debts")
      .update({
        paid_amount: paid,
        status: paid >= Number(data.total_amount) ? "pago" : "parcial",
      })
      .eq("id", p.id);
  }
}

export async function payDebt(params: {
  debtId: string;
  amount: number;
  accountId?: string;
  date: string;
}): Promise<void> {
  const { supabase, user } = await ctx();
  if (!user) return;

  const { data } = await supabase
    .from("debts")
    .select("total_amount,paid_amount,installments,creditor")
    .eq("id", params.debtId)
    .maybeSingle();
  if (!data) return;

  const total = Number(data.total_amount);
  const outstanding = total - Number(data.paid_amount);
  const applied = Math.min(params.amount, outstanding);
  if (applied <= 0) return;

  const paid = Number(data.paid_amount) + applied;
  const installments = Number(data.installments) || 0;
  const installmentValue = installments > 0 ? total / installments : total;
  const paidInstallments =
    paid >= total
      ? installments
      : Math.min(installments, Math.round(paid / installmentValue));

  await supabase
    .from("debts")
    .update({
      paid_amount: paid,
      paid_installments: paidInstallments,
      status: paid >= total ? "pago" : "parcial",
    })
    .eq("id", params.debtId);

  if (params.accountId) {
    await supabase.from("transactions").insert({
      user_id: user.id,
      account_id: params.accountId,
      type: "despesa",
      amount: applied,
      category: "outros",
      description: `Pagamento — ${data.creditor ?? "dívida"}`,
      date: params.date,
      recurring: false,
    });
    await adjustBalance(params.accountId, -applied);
  }
}

async function adjustBalance(accountId: string, delta: number) {
  const { supabase } = await ctx();
  const { data } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .maybeSingle();
  if (!data) return;
  await supabase
    .from("accounts")
    .update({ balance: Number(data.balance) + delta })
    .eq("id", accountId);
}
