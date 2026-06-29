-- ════════════════════════════════════════════════════════════════
-- KwanzaFlow — Schema inicial
-- PostgreSQL + Row Level Security. Cada utilizador vê apenas os seus dados.
-- ════════════════════════════════════════════════════════════════

-- ── Perfis ──────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  base_currency text not null default 'AOA',
  streak integer not null default 0,
  created_at timestamptz not null default now()
);

-- Cria perfil automaticamente ao registar utilizador.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Contas ──────────────────────────────────────────────────────
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null default 'corrente'
    check (kind in ('corrente','poupanca','investimento','carteira')),
  balance numeric(16,2) not null default 0,
  currency text not null default 'AOA',
  icon text not null default 'Landmark',
  color text not null default 'var(--chart-1)',
  target_balance numeric(16,2),
  created_at timestamptz not null default now()
);

-- ── Transações ──────────────────────────────────────────────────
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  type text not null check (type in ('receita','despesa','transferencia')),
  amount numeric(16,2) not null check (amount >= 0),
  category text not null default 'outros',
  description text not null default '',
  date date not null default current_date,
  to_account_id uuid references public.accounts (id) on delete set null,
  recurring boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- ── Salários ────────────────────────────────────────────────────
create table if not exists public.salaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'Salário',
  amount numeric(16,2) not null default 0,
  frequency text not null default 'mensal'
    check (frequency in ('semanal','quinzenal','mensal','personalizado')),
  pay_day integer not null default 1 check (pay_day between 1 and 31),
  account_id uuid references public.accounts (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Dívidas ─────────────────────────────────────────────────────
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  creditor text not null,
  total_amount numeric(16,2) not null default 0,
  paid_amount numeric(16,2) not null default 0,
  installments integer not null default 1,
  paid_installments integer not null default 0,
  due_date date,
  priority text not null default 'media'
    check (priority in ('baixa','media','alta','critica')),
  status text not null default 'pendente'
    check (status in ('pendente','parcial','pago')),
  created_at timestamptz not null default now()
);

-- ── Pagamentos recorrentes ──────────────────────────────────────
create table if not exists public.recurring_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  kind text not null default 'outros',
  category text not null default 'outros',
  amount numeric(16,2) not null default 0,
  day_of_month integer not null default 1 check (day_of_month between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Metas ───────────────────────────────────────────────────────
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  target_amount numeric(16,2) not null default 0,
  current_amount numeric(16,2) not null default 0,
  deadline date,
  status text not null default 'ativa'
    check (status in ('ativa','concluida','pausada')),
  monthly_contribution numeric(16,2),
  color text not null default 'var(--chart-1)',
  created_at timestamptz not null default now()
);

-- ── Missões ─────────────────────────────────────────────────────
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  kind text not null default 'poupar'
    check (kind in ('eliminar_dividas','poupar','comprar','investir','negocio')),
  target_amount numeric(16,2),
  deadline date,
  status text not null default 'ativa'
    check (status in ('ativa','concluida','arquivada')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════
-- Row Level Security: cada utilizador acede apenas às suas linhas.
-- ════════════════════════════════════════════════════════════════
alter table public.profiles            enable row level security;
alter table public.accounts            enable row level security;
alter table public.transactions        enable row level security;
alter table public.salaries            enable row level security;
alter table public.debts               enable row level security;
alter table public.recurring_payments  enable row level security;
alter table public.goals               enable row level security;
alter table public.missions            enable row level security;

-- Perfil (id = auth.uid()). Idempotente: remove antes de recriar.
drop policy if exists "perfil_proprio" on public.profiles;
create policy "perfil_proprio" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Macro de políticas para tabelas com user_id (re-executável sem erros).
do $$
declare t text;
begin
  foreach t in array array[
    'accounts','transactions','salaries','debts',
    'recurring_payments','goals','missions'
  ]
  loop
    execute format('drop policy if exists %I on public.%I;', t || '_owner', t);
    execute format(
      'create policy %I on public.%I for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id);',
      t || '_owner', t
    );
  end loop;
end$$;
