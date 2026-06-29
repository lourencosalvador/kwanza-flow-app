/**
 * Inicialização da conta real do utilizador (Lourenço Cardoso).
 * Cria/garante o utilizador de autenticação e persiste TODOS os dados no Supabase.
 * Idempotente: limpa os dados financeiros do utilizador antes de reinserir.
 *
 * Correr:  SEED_USER_PASSWORD="<password>" node --env-file=.env.local scripts/seed-user.mjs
 *   (no PowerShell:  $env:SEED_USER_PASSWORD="<password>"; node --env-file=.env.local scripts/seed-user.mjs)
 *
 * Usa a SERVICE_ROLE (ignora RLS) só para semear; no fim verifica via RLS
 * autenticando como o próprio utilizador.
 *
 * A password do utilizador NÃO está no código (segurança) — vem de
 * SEED_USER_PASSWORD. O email pode ser definido via SEED_USER_EMAIL.
 */

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE || !ANON) {
  console.error("Faltam variáveis Supabase no .env.local");
  process.exit(1);
}

const EMAIL = process.env.SEED_USER_EMAIL || "lorrys@horizon-development.com";
const PASSWORD = process.env.SEED_USER_PASSWORD;
const FULL_NAME = "Lourenço Cardoso";

if (!PASSWORD) {
  console.error(
    "Defina SEED_USER_PASSWORD antes de correr. Ex.: $env:SEED_USER_PASSWORD=\"...\"",
  );
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
const DEADLINE = "2026-12-01"; // primeiro salário de dezembro

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── 1. Utilizador de autenticação ───────────────────────────────
let userId;
{
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const existing = list.users.find((u) => u.email === EMAIL);
  if (existing) {
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    });
    console.log("• Utilizador existente reutilizado:", userId);
  } else {
    const { data, error: cErr } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    });
    if (cErr) throw cErr;
    userId = data.user.id;
    console.log("• Utilizador criado:", userId);
  }
}

// ── 2. Perfil ────────────────────────────────────────────────────
await admin
  .from("profiles")
  .upsert({ id: userId, full_name: FULL_NAME, base_currency: "AOA", streak: 0 });

// ── 3. Limpar dados anteriores (idempotência) ───────────────────
for (const t of [
  "transactions",
  "salaries",
  "debts",
  "recurring_payments",
  "goals",
  "missions",
  "accounts",
]) {
  await admin.from(t).delete().eq("user_id", userId);
}

// ── 4. Contas bancárias ─────────────────────────────────────────
const { data: accs, error: accErr } = await admin
  .from("accounts")
  .insert([
    {
      user_id: userId,
      name: "Atlantic",
      kind: "poupanca",
      balance: 0,
      currency: "AOA",
      icon: "PiggyBank",
      color: "var(--chart-1)",
      target_balance: 705000, // fundo de emergência (3× despesas fixas)
    },
    {
      user_id: userId,
      name: "BAI",
      kind: "corrente",
      balance: 530000, // salário acabado de receber
      currency: "AOA",
      icon: "Landmark",
      color: "var(--chart-2)",
      target_balance: null,
    },
    {
      user_id: userId,
      name: "BFA",
      kind: "poupanca",
      balance: 0,
      currency: "AOA",
      icon: "KeyRound",
      color: "var(--chart-3)",
      target_balance: 210000, // reserva de renda (trimestral)
    },
  ])
  .select();
if (accErr) throw accErr;
const acc = Object.fromEntries(accs.map((a) => [a.name, a.id]));

// ── 5. Salário (quinzenal, recebido no BAI) ─────────────────────
await admin.from("salaries").insert({
  user_id: userId,
  label: "Salário quinzenal",
  amount: 530000,
  frequency: "quinzenal",
  pay_day: 15,
  account_id: acc["BAI"],
  active: true,
});

// ── 6. Despesas fixas mensais (recorrentes) — total 235.000 ─────
await admin.from("recurring_payments").insert([
  { user_id: userId, label: "Renda (paga trimestralmente: 210.000)", kind: "renda", category: "renda", amount: 70000, day_of_month: 5, active: true },
  { user_id: userId, label: "Alimentação", kind: "outros", category: "alimentacao", amount: 70000, day_of_month: 1, active: true },
  { user_id: userId, label: "Energia", kind: "energia", category: "energia", amount: 10000, day_of_month: 10, active: true },
  { user_id: userId, label: "Internet", kind: "internet", category: "internet", amount: 25000, day_of_month: 10, active: true },
  { user_id: userId, label: "Táxi", kind: "outros", category: "transporte", amount: 20000, day_of_month: 1, active: true },
  { user_id: userId, label: "Empregada", kind: "empregada", category: "empregada", amount: 40000, day_of_month: 30, active: true },
]);

// ── 7. Dívidas atuais ────────────────────────────────────────────
await admin.from("debts").insert([
  { user_id: userId, creditor: "Ramiros", total_amount: 140000, paid_amount: 0, installments: 1, paid_installments: 0, due_date: today, priority: "alta", status: "pendente" },
  { user_id: userId, creditor: "Pai", total_amount: 180000, paid_amount: 0, installments: 1, paid_installments: 0, due_date: today, priority: "alta", status: "pendente" },
]);

// ── 8. Meta principal ───────────────────────────────────────────
await admin.from("goals").insert({
  user_id: userId,
  title: "Liberdade Financeira 2026",
  description:
    "Eliminar todas as dívidas, nunca fazer novos empréstimos, criar fundo de emergência e criar hábito de poupança até dezembro de 2026.",
  target_amount: 705000,
  current_amount: 0,
  deadline: DEADLINE,
  status: "ativa",
  monthly_contribution: null,
  color: "var(--chart-1)",
});

// ── 9. Missão (principal) ───────────────────────────────────────
await admin.from("missions").insert({
  user_id: userId,
  title: "Operação Liberdade Financeira",
  kind: "eliminar_dividas",
  target_amount: 705000,
  deadline: DEADLINE,
  status: "ativa",
  is_primary: true,
});

// ── 10. Transação: salário acabado de receber ───────────────────
await admin.from("transactions").insert({
  user_id: userId,
  account_id: acc["BAI"],
  type: "receita",
  amount: 530000,
  category: "outros",
  description: "Salário quinzenal recebido",
  date: today,
  recurring: true,
});

console.log("• Dados inseridos.");

// ── 11. Verificação via RLS (autenticar como o utilizador) ──────
const asUser = createClient(URL, ANON, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { error: signErr } = await asUser.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
});
if (signErr) throw signErr;

const tables = ["accounts", "salaries", "recurring_payments", "debts", "goals", "missions", "transactions"];
const counts = {};
for (const t of tables) {
  const { count } = await asUser.from(t).select("*", { count: "exact", head: true });
  counts[t] = count ?? 0;
}

console.log("\n✅ Verificação via RLS (visível pelo próprio utilizador):");
console.table(counts);
console.log("\nLogin:", EMAIL, "/ password: (a definida em SEED_USER_PASSWORD)");
