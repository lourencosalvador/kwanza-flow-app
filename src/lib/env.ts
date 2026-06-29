/**
 * Acesso centralizado e seguro às variáveis de ambiente.
 * Variáveis sem prefixo NEXT_PUBLIC_ só existem no servidor.
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "KwanzaFlow",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

/** Server-only. Não importar em componentes de cliente. */
export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
};

/** Supabase está configurado? */
export const isSupabaseConfigured =
  !!env.supabaseUrl && !!env.supabaseAnonKey;

/**
 * Modo demonstração: corre com dados locais quando explicitamente ativo
 * ou quando o Supabase ainda não foi configurado.
 */
export const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !isSupabaseConfigured;

export const isOpenAIConfigured = !!serverEnv.openaiApiKey;
