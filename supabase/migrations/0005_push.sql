-- ════════════════════════════════════════════════════════════════
-- KwanzaFlow  Migração 0005: Web Push (notificações no telemóvel)
-- Tabelas de subscrições e tokens de ligação de dispositivo (QR) +
-- função SECURITY DEFINER que liga o telemóvel à conta sem service_role.
-- Idempotente.
-- ════════════════════════════════════════════════════════════════

-- Subscrições de push (uma por dispositivo/endpoint).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  platform text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

-- Tokens efémeros para ligar um telemóvel via QR.
create table if not exists public.device_link_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

alter table public.push_subscriptions enable row level security;
alter table public.device_link_tokens enable row level security;

-- Cada utilizador gere as suas subscrições e tokens.
drop policy if exists "push_subscriptions_owner" on public.push_subscriptions;
create policy "push_subscriptions_owner" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "device_link_tokens_owner" on public.device_link_tokens;
create policy "device_link_tokens_owner" on public.device_link_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Liga o telemóvel: valida o token (não expirado/consumido) e regista a
-- subscrição para o dono do token. SECURITY DEFINER ignora o RLS de forma
-- controlada — o acesso é limitado por posse de um token válido.
create or replace function public.link_push_device(
  p_token text,
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_platform text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id
  from public.device_link_tokens
  where token = p_token
    and consumed_at is null
    and expires_at > now();

  if v_user_id is null then
    raise exception 'token_invalido_ou_expirado';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, platform, user_agent)
  values (v_user_id, p_endpoint, p_p256dh, p_auth, p_platform, p_user_agent)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        platform = excluded.platform,
        user_agent = excluded.user_agent;

  update public.device_link_tokens
    set consumed_at = now()
    where token = p_token;
end;
$$;

-- Pode ser chamada sem sessão (o telemóvel ligado não está autenticado).
grant execute on function public.link_push_device(text, text, text, text, text, text)
  to anon, authenticated;
