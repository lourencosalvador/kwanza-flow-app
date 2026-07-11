"use server";

/**
 * Server Actions para notificações push no telemóvel.
 * - createDeviceLinkToken: gera um token efémero (para o QR) do utilizador autenticado.
 * - sendTestPush: envia uma notificação de teste para os dispositivos do utilizador.
 * O user_id vem sempre da sessão; o envio usa VAPID (web-push), não service_role.
 */

import { createClient } from "@/lib/supabase/server";
import { sendToSubscriptions } from "@/lib/push/server";
import { env, isPushConfigured } from "@/lib/env";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const TOKEN_TTL_MIN = 10;

/** Cria um token de ligação e devolve o URL para o QR. */
export async function createDeviceLinkToken(): Promise<
  { ok: true; url: string; expiresInMin: number } | { ok: false; error: string }
> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Sessão necessária" };
  if (!isPushConfigured) return { ok: false, error: "Push não configurado (VAPID)" };

  const token =
    crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MIN * 60_000).toISOString();

  const { error } = await supabase
    .from("device_link_tokens")
    .insert({ token, user_id: user.id, expires_at: expiresAt });
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    url: `${env.appUrl}/link?t=${token}`,
    expiresInMin: TOKEN_TTL_MIN,
  };
}

/** Envia uma notificação de teste para todos os dispositivos do utilizador. */
export async function sendTestPush(): Promise<
  { ok: true; sent: number; failed: number } | { ok: false; error: string }
> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Sessão necessária" };
  if (!isPushConfigured) return { ok: false, error: "Push não configurado (VAPID)" };

  const { data } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth");
  const subs = data ?? [];
  if (subs.length === 0) return { ok: false, error: "Nenhum telemóvel ligado" };

  const result = await sendToSubscriptions(subs, {
    title: "KwanzaFlow",
    body: "🔔 Notificações ativas! Vais receber avisos aqui no telemóvel.",
    url: "/dashboard",
    tag: "kwanzaflow-test",
  });

  if (result.expired.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", result.expired);
  }

  return { ok: true, sent: result.sent, failed: result.failed };
}
