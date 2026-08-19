-- ════════════════════════════════════════════════════════════════
-- KwanzaFlow  Migração 0006: Subcontas ("envelopes" dentro de uma conta)
-- Ex.: Atlântico 100.000 → Lazer 10.000 + Alimentação 80.000 (+ 10.000 livre)
-- Idempotente.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.sub_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  balance numeric(16,2) not null default 0,
  icon text not null default 'Wallet',
  color text not null default 'var(--chart-1)',
  created_at timestamptz not null default now()
);
create index if not exists sub_accounts_user_idx on public.sub_accounts (user_id);
create index if not exists sub_accounts_account_idx on public.sub_accounts (account_id);

alter table public.sub_accounts enable row level security;

drop policy if exists "sub_accounts_owner" on public.sub_accounts;
create policy "sub_accounts_owner" on public.sub_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
