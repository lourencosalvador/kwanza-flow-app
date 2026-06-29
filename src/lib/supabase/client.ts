"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Cliente Supabase para o browser (componentes de cliente).
 * Tipagem solta até gerar os tipos com `supabase gen types` (ver README).
 */
export function createClient() {
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
