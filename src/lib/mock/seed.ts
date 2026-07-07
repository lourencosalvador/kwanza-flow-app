/**
 * Dados de demonstração (NEXT_PUBLIC_DEMO_MODE=true).
 * Persona: Lourenço, em Luanda. Moeda: AOA (Kwanza).
 * Gerados relativamente à data atual para alimentar gráficos e o "mês corrente".
 */

import type { FinancialSnapshot, Plan, Transaction } from "@/types/domain";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayThisMonth(day: number, ref: Date) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), day);
  return iso(d);
}

function monthsAgo(n: number, day: number, ref: Date) {
  const d = new Date(ref.getFullYear(), ref.getMonth() - n, day);
  return iso(d);
}

export function buildSeed(ref: Date = new Date()): FinancialSnapshot {
  const profile = {
    id: "demo-user",
    fullName: "Lourenço",
    email: "lorrys@horizon-development.com",
    baseCurrency: "AOA" as const,
    streak: 12,
    strategy: {
      monthlySavingsTarget: null,
      emergencyBufferEnabled: true,
      optimizeForGoal: true,
    },
  };

  const accounts = [
    {
      id: "acc-bai",
      name: "BAI",
      kind: "corrente" as const,
      balance: 420_000,
      currency: "AOA" as const,
      icon: "Landmark",
      color: "var(--chart-1)",
      targetBalance: 500_000,
      createdAt: monthsAgo(8, 1, ref),
    },
    {
      id: "acc-bfa",
      name: "BFA Poupança",
      kind: "poupanca" as const,
      balance: 1_250_000,
      currency: "AOA" as const,
      icon: "PiggyBank",
      color: "var(--chart-2)",
      targetBalance: 3_000_000,
      createdAt: monthsAgo(8, 1, ref),
    },
    {
      id: "acc-atl",
      name: "Atlântico",
      kind: "corrente" as const,
      balance: 95_000,
      currency: "AOA" as const,
      icon: "Wallet",
      color: "var(--chart-3)",
      createdAt: monthsAgo(5, 1, ref),
    },
    {
      id: "acc-inv",
      name: "Investimentos (OT)",
      kind: "investimento" as const,
      balance: 600_000,
      currency: "AOA" as const,
      icon: "TrendingUp",
      color: "var(--chart-4)",
      createdAt: monthsAgo(6, 1, ref),
    },
  ];

  const salaries = [
    {
      id: "sal-1",
      label: "Salário principal",
      amount: 850_000,
      frequency: "mensal" as const,
      payDay: 28,
      accountId: "acc-bai",
      active: true,
    },
  ];

  const recurring = [
    { id: "rec-renda", label: "Renda da casa", kind: "renda" as const, category: "renda" as const, amount: 200_000, dayOfMonth: 5, active: true },
    { id: "rec-net", label: "Internet (Unitel)", kind: "internet" as const, category: "internet" as const, amount: 25_000, dayOfMonth: 10, active: true },
    { id: "rec-energia", label: "Energia (ENDE)", kind: "energia" as const, category: "energia" as const, amount: 30_000, dayOfMonth: 12, active: true },
    { id: "rec-agua", label: "Água (EPAL)", kind: "agua" as const, category: "agua" as const, amount: 8_000, dayOfMonth: 12, active: true },
    { id: "rec-empregada", label: "Empregada", kind: "empregada" as const, category: "empregada" as const, amount: 60_000, dayOfMonth: 30, active: true },
  ];

  const debts = [
    {
      id: "debt-1",
      creditor: "Banco BAI (cartão)",
      totalAmount: 480_000,
      paidAmount: 180_000,
      installments: 12,
      paidInstallments: 5,
      dueDate: dayThisMonth(20, ref),
      priority: "alta" as const,
      status: "parcial" as const,
      history: [
        { date: monthsAgo(4, 20, ref), amount: 40_000 },
        { date: monthsAgo(3, 20, ref), amount: 40_000 },
        { date: monthsAgo(2, 20, ref), amount: 50_000 },
        { date: monthsAgo(1, 20, ref), amount: 50_000 },
      ],
    },
    {
      id: "debt-2",
      creditor: "Tio Mário",
      totalAmount: 150_000,
      paidAmount: 50_000,
      installments: 3,
      paidInstallments: 1,
      dueDate: dayThisMonth(25, ref),
      priority: "media" as const,
      status: "parcial" as const,
      history: [{ date: monthsAgo(1, 25, ref), amount: 50_000 }],
    },
  ];

  const goals = [
    {
      id: "goal-emergencia",
      title: "Fundo de Emergência",
      description: "3 meses de despesas fixas",
      targetAmount: 1_000_000,
      currentAmount: 700_000,
      status: "ativa" as const,
      monthlyContribution: 100_000,
      color: "var(--chart-2)",
    },
    {
      id: "goal-carro",
      title: "Entrada do carro",
      description: "Toyota RAV4",
      targetAmount: 4_000_000,
      currentAmount: 850_000,
      deadline: iso(new Date(ref.getFullYear() + 1, 5, 1)),
      status: "ativa" as const,
      monthlyContribution: 150_000,
      color: "var(--chart-4)",
    },
  ];

  const missions = [
    {
      id: "mission-1",
      title: "Guardar 3 milhões de Kwanzas",
      kind: "poupar" as const,
      targetAmount: 3_000_000,
      deadline: iso(new Date(ref.getFullYear() + 1, 11, 31)),
      status: "ativa" as const,
      isPrimary: true,
      createdAt: monthsAgo(3, 1, ref),
    },
    {
      id: "mission-2",
      title: "Eliminar todas as dívidas",
      kind: "eliminar_dividas" as const,
      status: "ativa" as const,
      isPrimary: false,
      createdAt: monthsAgo(3, 1, ref),
    },
  ];

  // Transações do mês corrente (+ salário recebido).
  const transactions: Transaction[] = [
    { id: "tx-sal", accountId: "acc-bai", type: "receita", amount: 850_000, category: "outros", description: "Salário de " + iso(ref).slice(0, 7), date: dayThisMonth(1, ref), recurring: true },
    { id: "tx-renda", accountId: "acc-bai", type: "despesa", amount: 200_000, category: "renda", description: "Renda da casa", date: dayThisMonth(5, ref), recurring: true },
    { id: "tx-net", accountId: "acc-bai", type: "despesa", amount: 25_000, category: "internet", description: "Internet Unitel", date: dayThisMonth(10, ref), recurring: true },
    { id: "tx-energia", accountId: "acc-bai", type: "despesa", amount: 30_000, category: "energia", description: "Energia ENDE", date: dayThisMonth(12, ref), recurring: true },
    { id: "tx-agua", accountId: "acc-bai", type: "despesa", amount: 8_000, category: "agua", description: "Água EPAL", date: dayThisMonth(12, ref), recurring: true },
    { id: "tx-merc1", accountId: "acc-atl", type: "despesa", amount: 65_000, category: "alimentacao", description: "Mercado Kero", date: dayThisMonth(6, ref) },
    { id: "tx-merc2", accountId: "acc-atl", type: "despesa", amount: 42_000, category: "alimentacao", description: "Talho + feira", date: dayThisMonth(15, ref) },
    { id: "tx-transp", accountId: "acc-atl", type: "despesa", amount: 35_000, category: "transporte", description: "Combustível", date: dayThisMonth(8, ref) },
    { id: "tx-lazer", accountId: "acc-atl", type: "despesa", amount: 28_000, category: "lazer", description: "Jantar fora", date: dayThisMonth(14, ref) },
    { id: "tx-saude", accountId: "acc-bai", type: "despesa", amount: 18_000, category: "saude", description: "Farmácia", date: dayThisMonth(9, ref) },
    { id: "tx-familia", accountId: "acc-bai", type: "despesa", amount: 40_000, category: "familia", description: "Apoio à família", date: dayThisMonth(11, ref) },
    { id: "tx-poup", accountId: "acc-bfa", type: "receita", amount: 100_000, category: "investimentos", description: "Transferência para poupança", date: dayThisMonth(2, ref) },
    { id: "tx-divida", accountId: "acc-bai", type: "despesa", amount: 50_000, category: "outros", description: "Pagamento cartão BAI", date: dayThisMonth(20, ref) },
  ];

  const plans: Plan[] = [
    {
      id: "plan-mes",
      title: "Plano do Mês",
      period: "Mensal",
      budget: 850_000,
      createdAt: monthsAgo(0, 1, ref),
      tasks: [
        { id: "t1", label: "Pagar renda até dia 5", done: true },
        { id: "t2", label: "Guardar 150 000 Kz", done: false },
        { id: "t3", label: "Abater dívida do cartão", done: false },
      ],
    },
  ];

  return { profile, accounts, transactions, salaries, debts, recurring, goals, missions, plans };
}

/** Snapshot vazio: estado inicial em modo live (dados vêm do Supabase). */
export function buildEmptySnapshot(): FinancialSnapshot {
  return {
    profile: {
      id: "",
      fullName: "",
      email: "",
      baseCurrency: "AOA",
      streak: 0,
      strategy: {
        monthlySavingsTarget: null,
        emergencyBufferEnabled: true,
        optimizeForGoal: true,
      },
    },
    accounts: [],
    transactions: [],
    salaries: [],
    debts: [],
    recurring: [],
    goals: [],
    missions: [],
    plans: [],
  };
}

// Timeline, notificações e conquistas já não são mock: são derivadas dos
// dados reais do snapshot em src/lib/derive/.
