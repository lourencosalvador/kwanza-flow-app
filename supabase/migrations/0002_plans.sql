-- ════════════════════════════════════════════════════════════════
-- KwanzaFlow  Migração 0002: Planos (Planeamento dinâmico)
-- Idempotente: pode ser executada várias vezes sem erro.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  period text not null default 'Mensal',
  budget numeric(16,2) not null default 0,
  -- Lista de tarefas/checklist: [{ "id": "...", "label": "...", "done": false }]
  tasks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;

drop policy if exists "plans_owner" on public.plans;
create policy "plans_owner" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
