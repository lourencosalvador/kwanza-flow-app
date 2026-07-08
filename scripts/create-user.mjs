/**
 * Cria um utilizador de autenticação (sem dados financeiros).
 * Método fiável no Supabase: Admin API (a password é hasheada corretamente).
 * Criar utilizadores via SQL puro em auth.users é frágil e não é recomendado.
 *
 * Correr (PowerShell):
 *   $env:NEW_USER_EMAIL="romeucajamba@gmail.com"
 *   $env:NEW_USER_NAME="Romeu Cajamba"
 *   $env:NEW_USER_PASSWORD="<password>"
 *   node --env-file=.env.local scripts/create-user.mjs
 */

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = process.env.NEW_USER_EMAIL;
const NAME = process.env.NEW_USER_NAME ?? EMAIL;
const PASSWORD = process.env.NEW_USER_PASSWORD;

if (!URL || !SERVICE) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}
if (!EMAIL || !PASSWORD) {
  console.error(
    'Defina NEW_USER_EMAIL e NEW_USER_PASSWORD. Ex.: $env:NEW_USER_EMAIL="romeucajamba@gmail.com"; $env:NEW_USER_PASSWORD="..."',
  );
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Reutiliza se já existir; senão cria.
const { data: list, error: listErr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listErr) throw listErr;

const existing = list.users.find((u) => u.email === EMAIL);
let userId;

if (existing) {
  userId = existing.id;
  await admin.auth.admin.updateUserById(userId, {
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: NAME },
  });
  console.log("• Utilizador já existia — password/nome atualizados:", EMAIL);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: NAME },
  });
  if (error) throw error;
  userId = data.user.id;
  console.log("• Utilizador criado:", EMAIL, "→", userId);
}

// Garante o perfil (o trigger normalmente já o cria).
await admin
  .from("profiles")
  .upsert({ id: userId, full_name: NAME, base_currency: "AOA", streak: 0 });

console.log("✅ Pronto. A conta começa vazia; os dados são criados na app.");
console.log("   Login:", EMAIL);
