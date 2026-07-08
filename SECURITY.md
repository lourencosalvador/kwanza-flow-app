# Segurança e privacidade dos dados — KwanzaFlow

Este documento descreve como o KwanzaFlow garante que **cada utilizador só
acede aos seus próprios dados** e como isso é **verificado automaticamente**.

## Modelo de isolamento (Row Level Security)

Os dados vivem no PostgreSQL do Supabase. **Todas as tabelas de dados** têm
**Row Level Security (RLS) ativado** com uma política dupla:

```sql
using (auth.uid() = user_id)        -- só lê/altera as suas linhas
with check (auth.uid() = user_id)   -- só insere/atualiza como si próprio
```

Tabelas cobertas: `profiles` (por `id = auth.uid()`), `accounts`,
`transactions`, `salaries`, `debts`, `recurring_payments`, `goals`,
`missions`, `plans`. O `user_id` é sempre derivado da sessão autenticada
(`auth.uid()`), **nunca** de valores enviados pelo cliente.

Consequência: mesmo que alguém conheça o `id` da linha de outro utilizador,
qualquer `SELECT/UPDATE/DELETE` é filtrado pela base de dados e devolve/afeta
**zero** linhas. O isolamento é imposto **no servidor de base de dados**, não
na interface.

## Chaves e acessos

- **Chave anon (pública):** usada no browser. É pública por desenho — a
  segurança vem do RLS, não de a esconder. Sozinha, só permite o que o RLS
  autoriza para o utilizador com sessão.
- **Chave `service_role` (secreta):** ignora o RLS. **Nunca é usada em runtime
  na aplicação** — apenas em scripts administrativos locais (`scripts/`). Não
  está nas variáveis do frontend nem em nenhuma rota/Server Action.
- **Sessões:** Supabase Auth (JWT). Palavras-passe são guardadas com hash
  (bcrypt) pelo Supabase — a aplicação nunca vê nem armazena passwords.
- **Proteção de rotas:** o middleware exige sessão válida em todas as páginas
  da área autenticada; sem sessão, redireciona para `/login`.

## Storage (fotos de perfil)

O bucket `avatars` tem leitura pública (as fotos não são dados sensíveis), mas
**a escrita está restrita à pasta do próprio utilizador** (`<uid>/...`) por
políticas de storage. Ninguém pode substituir a foto de outro utilizador.

## Verificação automática (certificação repetível)

O script [`scripts/security-audit.mjs`](scripts/security-audit.mjs) cria dois
utilizadores efémeros, semeia dados em cada um e tenta, como utilizador A,
**ler, alterar, apagar e inserir-se** nos dados do utilizador B em várias
tabelas. Todas as tentativas devem falhar.

```bash
pnpm audit:security
```

Resultado esperado (última execução): **19/19 verificações PASS** —
`✅ ISOLAMENTO CONFIRMADO`. O script sai com código ≠ 0 se algo falhar, pelo
que pode correr em CI a cada deploy.

> Regra de ouro: **qualquer tabela nova tem de ter RLS ativado e a política
> `auth.uid() = user_id` antes de ir para produção.** Adicione-a também ao
> array `TABLES` do script de auditoria.

## Recomendações adicionais (defesa em profundidade)

- No painel Supabase → Authentication → ativar **proteção contra passwords
  vазadas** (HaveIBeenPwned) e, opcionalmente, **MFA**.
- **Rodar** periodicamente as chaves (`service_role` e OpenAI) e após qualquer
  exposição.
- Ativar **backups**/Point-in-Time Recovery no plano Supabase.
- Manter a `service_role` fora da Vercel (a app não precisa dela em runtime).
