-- ════════════════════════════════════════════════════════════════
-- KwanzaFlow  Migração 0007: Eventos de calendário (dinâmicos)
-- Lembretes/compromissos financeiros que o utilizador (ou a IA) adiciona.
-- Os salários e pagamentos recorrentes continuam a ser derivados; estes são
-- eventos livres, por data.
-- Idempotente.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  date date not null,
  amount numeric(16,2),
  kind text not null default 'lembrete'
    check (kind in ('entrada', 'saida', 'lembrete')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists calendar_events_user_date_idx
  on public.calendar_events (user_id, date);

alter table public.calendar_events enable row level security;

drop policy if exists "calendar_events_owner" on public.calendar_events;
create policy "calendar_events_owner" on public.calendar_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
