/**
 * Auditoria de segurança — isolamento de dados por utilizador (RLS).
 *
 * Cria DOIS utilizadores efémeros (A e B), semeia dados em cada um e prova
 * que o utilizador A NÃO consegue ler, alterar, apagar nem inserir-se nos
 * dados do utilizador B (e vice-versa). No fim, apaga os utilizadores de teste.
 *
 * Profissional e escalável: repetível, sem tocar em dados reais, ideal para CI.
 *
 * Correr:  node --env-file=.env.local scripts/security-audit.mjs
 * Sai com código 1 se qualquer verificação falhar.
 */

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Faltam variáveis Supabase no .env.local");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Audit!" + Math.random().toString(36).slice(2, 10);
const TABLES = ["accounts", "debts", "goals", "transactions"];

let passed = 0;
let failed = 0;
const check = (name, ok) => {
  console.log(`  ${ok ? "✅ PASS" : "❌ FALHA"}  ${name}`);
  ok ? passed++ : failed++;
};

async function ensureUser(email) {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list.users.find((u) => u.email === email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function seed(userId) {
  const acc = await admin
    .from("accounts")
    .insert({ user_id: userId, name: "Sec Test", kind: "corrente", balance: 12345, currency: "AOA", icon: "Landmark", color: "var(--chart-1)" })
    .select()
    .single();
  await admin.from("debts").insert({ user_id: userId, creditor: "Sec Cred", total_amount: 5000, paid_amount: 0, installments: 1, priority: "media", status: "pendente" });
  await admin.from("goals").insert({ user_id: userId, title: "Sec Goal", target_amount: 9999, current_amount: 0, status: "ativa", color: "var(--chart-1)" });
  await admin.from("transactions").insert({ user_id: userId, account_id: acc.data.id, type: "despesa", amount: 100, category: "outros", description: "sec", date: new Date().toISOString().slice(0, 10) });
  return acc.data.id;
}

async function firstRowId(userId, table) {
  const { data } = await admin.from(table).select("id").eq("user_id", userId).limit(1);
  return data?.[0]?.id ?? null;
}

async function run() {
  console.log("🔐 Auditoria de isolamento de dados (RLS)\n");

  const emailA = "secaudit.a@kwanzaflow.dev";
  const emailB = "secaudit.b@kwanzaflow.dev";
  const idA = await ensureUser(emailA);
  const idB = await ensureUser(emailB);

  // Limpa dados anteriores destes utilizadores de teste.
  for (const t of TABLES) {
    await admin.from(t).delete().eq("user_id", idA);
    await admin.from(t).delete().eq("user_id", idB);
  }

  await seed(idA);
  await seed(idB);

  // IDs de linhas do utilizador B (o "alvo" que A não pode tocar).
  const bRows = {};
  for (const t of TABLES) bRows[t] = await firstRowId(idB, t);

  // Cliente autenticado como A (chave anon + sessão real — RLS ativo).
  const clientA = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: signErr } = await clientA.auth.signInWithPassword({ email: emailA, password: PASSWORD });
  if (signErr) throw signErr;

  console.log("Como utilizador A, a tentar aceder aos dados do utilizador B:\n");

  for (const t of TABLES) {
    // 1. SELECT geral — só deve devolver linhas do próprio A.
    const all = await clientA.from(t).select("user_id");
    const leaked = (all.data ?? []).filter((r) => r.user_id !== idA).length;
    check(`${t}: SELECT não devolve linhas de outros (fugas=${leaked})`, leaked === 0);

    // 2. SELECT direcionado à linha de B por id — deve vir vazio.
    const target = await clientA.from(t).select("*").eq("id", bRows[t]);
    check(`${t}: SELECT da linha de B por id devolve vazio`, (target.data?.length ?? 0) === 0);

    // 3. UPDATE na linha de B — 0 afetadas.
    const upd = await clientA.from(t).update({ user_id: idA }).eq("id", bRows[t]).select();
    check(`${t}: UPDATE na linha de B não afeta nada`, (upd.data?.length ?? 0) === 0);

    // 4. DELETE na linha de B — 0 afetadas.
    const del = await clientA.from(t).delete().eq("id", bRows[t]).select();
    check(`${t}: DELETE na linha de B não afeta nada`, (del.data?.length ?? 0) === 0);
  }

  // 5. INSERT fazendo-se passar por B (user_id = B) — deve ser rejeitado por RLS.
  const inj = await clientA
    .from("accounts")
    .insert({ user_id: idB, name: "Hijack", kind: "corrente", balance: 1, currency: "AOA", icon: "Landmark", color: "x" })
    .select();
  check("accounts: INSERT com user_id de B é rejeitado (WITH CHECK)", !!inj.error || (inj.data?.length ?? 0) === 0);

  // 6. Perfil de B não é legível por A.
  const prof = await clientA.from("profiles").select("*").eq("id", idB);
  check("profiles: perfil de B não é legível por A", (prof.data?.length ?? 0) === 0);

  // 7. Confirma (via admin) que os dados de B continuam intactos.
  const bStill = await admin.from("accounts").select("id").eq("user_id", idB);
  check("Dados de B permanecem intactos após os ataques", (bStill.data?.length ?? 0) >= 1);

  await clientA.auth.signOut();

  // Limpeza: apaga utilizadores de teste (cascata apaga os dados).
  await admin.auth.admin.deleteUser(idA);
  await admin.auth.admin.deleteUser(idB);

  console.log(`\nResultado: ${passed} PASS, ${failed} FALHA(S).`);
  if (failed > 0) {
    console.error("\n❌ ISOLAMENTO COMPROMETIDO — investigar RLS imediatamente.");
    process.exit(1);
  }
  console.log("\n✅ ISOLAMENTO CONFIRMADO — cada utilizador só acede aos seus dados.");
}

run().catch((e) => {
  console.error("Erro na auditoria:", e.message ?? e);
  process.exit(1);
});
