-- ════════════════════════════════════════════════════════════════
-- KwanzaFlow  Migração 0003: Estratégia Financeira do utilizador
-- Guarda a estratégia (capacidade planeada, buffer, etc.) por perfil.
-- Idempotente.
-- ════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists strategy jsonb not null default '{}'::jsonb;

-- Exemplo de conteúdo (dinâmico, por utilizador):
-- {
--   "monthlySavingsTarget": 660000,   -- capacidade PLANEADA (null = usa a teórica)
--   "emergencyBufferEnabled": true,
--   "optimizeForGoal": true
-- }
