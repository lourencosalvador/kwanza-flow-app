# KwanzaFlow AI — Sistema Operativo Financeiro

> Não é um gestor de despesas. É um **Financial OS**: ajuda a sair de dívidas,
> construir património, criar disciplina financeira e atingir missões — com um
> consultor inteligente sempre disponível.

Moeda base: **Kwanza (AOA)**. Idioma: **Português**.

---

## ✨ O que está construído

A aplicação **já corre com dados de demonstração** (persona "Lourenço", em Luanda),
sem necessidade de chaves. Assim que configurar o Supabase e a OpenAI, liga-se a
dados reais.

| Área | Estado |
|------|--------|
| **Painel** (saudação, resumo, missão, fluxo de caixa, categorias, próximos eventos) | ✅ |
| **Contas** bancárias (criar, saldo, objetivo, ícone, cor) | ✅ |
| **Salário** + Wizard "Recebi salário" (5 passos → alocação automática) | ✅ |
| **Motor Financeiro** (património, fluxo, metas, previsões, orçamento, saúde) | ✅ |
| **Consultor IA** (chat baseado em dados reais, streaming) | ✅ |
| **Modo Missão** (missão principal acompanhada em todo o sistema) | ✅ |
| **Simulador** de compras (impacto + veredito + opinião da IA) | ✅ |
| **Dívidas** (gráfico de redução, estratégia de quitação) | ✅ |
| **Metas** (progresso, previsão, reforços) | ✅ |
| **Analytics** (previsão de património, 50/30/20, categorias) | ✅ |
| **Timeline**, **Calendário**, **Planeamento**, **Conquistas** | ✅ |
| **Notificações inteligentes** | ✅ |
| **Dark/Light mode**, responsivo, micro-animações | ✅ |
| Schema **Supabase + RLS** | ✅ (migração pronta) |
| **Autenticação** (email/password, registo, logout, proteção de rotas) | ✅ |
| **Sincronização de dados** com Supabase (Server Actions + RLS) | ✅ |

---

## 🧠 Regra de ouro: a IA nunca calcula

```
┌────────────────┐     dados processados      ┌──────────────────┐
│ Motor Financeiro│ ─────────────────────────▶ │  Consultor IA    │
│ (TypeScript puro)│                            │ (OpenAI / backend)│
│ determinístico   │ ◀───── apenas interpreta ─ │  nunca calcula    │
└────────────────┘                             └──────────────────┘
```

- **`src/lib/financial-engine/`** — todos os cálculos (saldo, património, %,
  previsões, alocação de salário, simulações). Funções puras e testáveis.
- **`src/lib/ai/`** — recebe o relatório **já calculado** e apenas o interpreta.
  A comunicação com a OpenAI acontece **exclusivamente no backend**
  (`src/app/api/ai/chat/route.ts`). A chave **nunca** chega ao frontend.
- Sem chave OpenAI, o `local-advisor.ts` gera respostas fundamentadas nos
  mesmos dados — o chat funciona à mesma.

---

## 🏗️ Arquitetura (limpa, baseada em Features)

```
src/
├── app/                  # Next.js App Router (rotas + API)
│   ├── (app)/            # Área autenticada (shell com sidebar/topbar)
│   └── api/ai/chat/      # Route handler de streaming (backend-only)
├── components/
│   ├── ui/               # Primitivos shadcn/ui
│   ├── layout/           # Sidebar, Topbar, ThemeToggle
│   └── shared/           # StatCard, PageHeader, EmptyState
├── features/             # Cada feature: components/hooks/services/schemas
│   ├── dashboard/ accounts/ salary/ debts/ goals/
│   ├── missions/ simulator/ advisor/ analytics/
│   ├── timeline/ calendar/ planning/ gamification/ notifications/
├── lib/
│   ├── financial-engine/ # ❤️ o motor determinístico
│   ├── ai/               # OpenAI (server-only) + contexto + fallback local
│   ├── supabase/         # clients browser/server/middleware
│   ├── query/  mock/  format.ts  utils.ts  env.ts
├── store/                # Zustand (estado financeiro + UI)
├── hooks/  types/  config/
└── supabase/migrations/  # SQL + Row Level Security
```

**Stack:** Next.js 15 · TypeScript · Tailwind v4 · shadcn/ui · Framer Motion ·
React Hook Form · Zod · Zustand · TanStack Query · Recharts · Lucide · next-themes ·
Supabase · OpenAI Responses API.

---

## 🚀 Como correr

```bash
pnpm install
cp .env.example .env.local   # (no Windows: copy .env.example .env.local)
pnpm dev                     # http://localhost:3000
```

Por predefinição corre em **modo demonstração** (`NEXT_PUBLIC_DEMO_MODE=true`),
com dados locais persistidos no browser. Pode mexer em tudo — criar contas,
receber salário, simular compras, falar com o consultor.

### Ligar a dados reais — ORDEM IMPORTANTE

1. **Correr a migração primeiro.** No SQL Editor do Supabase, colar e executar
   todo o `supabase/migrations/0001_init.sql` (cria tabelas + RLS + trigger de perfil).
   *Tem de ser feito antes de desativar o modo demo*, senão o registo falha.
2. Preencher `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (apenas servidor)
   - `OPENAI_API_KEY`, `OPENAI_MODEL` (ex.: `gpt-4.1-mini`)
3. Definir `NEXT_PUBLIC_DEMO_MODE="false"` e reiniciar (`pnpm dev`).
4. Abrir `/login`, **criar conta** (email/password). O trigger cria o perfil
   automaticamente. A partir daí, contas/dívidas/metas/missões/salário são
   persistidos no Supabase (com RLS por utilizador) via Server Actions.

> Em modo demo (`true`), não há login obrigatório e os dados ficam locais
> (Zustand + localStorage). Em modo live (`false`), as rotas exigem sessão e o
> store é hidratado a partir do Supabase no arranque (`DataBootstrap`).

> Segurança: RLS ativo em todas as tabelas — cada utilizador só acede aos seus
> dados. As chaves de servidor nunca são expostas ao cliente.

---

## 📜 Scripts

| Comando | Ação |
|---------|------|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Servidor de produção |
| `pnpm typecheck` | Verificação de tipos |

---

## 🗺️ Próximos passos sugeridos

- Login social (Google / Apple) — requer configurar OAuth no painel Supabase
- Realtime (saldos/transações ao vivo) e Edge Functions para notificações
- Persistir categorias e pagamentos recorrentes/salários editáveis na BD
- Multi-moeda, equipas/família, planos Premium, API pública, integrações bancárias
- Testes automatizados (Vitest) sobre o `financial-engine`
- Gerar tipos da BD: `supabase gen types typescript --project-id <id> > src/types/supabase.ts`
