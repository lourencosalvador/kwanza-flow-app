/**
 * Derivações determinísticas a partir do snapshot REAL do utilizador.
 * Nada aqui é inventado: timeline, notificações e conquistas refletem
 * exatamente os dados que existem na base de dados.
 */

import type {
  Achievement,
  FinancialSnapshot,
  SmartNotification,
  TimelineEvent,
} from "@/types/domain";
import { formatCurrency } from "@/lib/format";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Próxima ocorrência de um dia do mês a partir de hoje. */
function nextOccurrence(day: number, ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), Math.min(day, 28));
  d.setDate(day);
  if (d < ref) d.setMonth(d.getMonth() + 1);
  return d;
}

function daysUntil(target: Date, ref: Date): number {
  return Math.round((target.getTime() - ref.getTime()) / 86_400_000);
}

// ── Timeline ────────────────────────────────────────────────────
export function deriveTimeline(
  snapshot: FinancialSnapshot,
  limit = 30,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Contas criadas
  for (const a of snapshot.accounts) {
    if (!a.createdAt) continue;
    events.push({
      id: `acc-${a.id}`,
      kind: "marco",
      title: `Conta ${a.name} criada`,
      date: a.createdAt,
    });
  }

  // Missões criadas
  for (const m of snapshot.missions) {
    if (!m.createdAt) continue;
    events.push({
      id: `mis-${m.id}`,
      kind: "missao",
      title: `Missão criada: ${m.title}`,
      date: m.createdAt,
    });
  }

  // Salários recebidos (receitas recorrentes)
  for (const t of snapshot.transactions) {
    if (t.type === "receita" && t.recurring) {
      events.push({
        id: `sal-${t.id}`,
        kind: "salario",
        title: t.description || "Salário recebido",
        amount: t.amount,
        date: t.date,
      });
    }
  }

  // Pagamentos de dívidas (histórico) e dívidas quitadas
  for (const d of snapshot.debts) {
    for (const [i, h] of (d.history ?? []).entries()) {
      events.push({
        id: `pay-${d.id}-${i}`,
        kind: "divida_quitada",
        title: `Pagamento a ${d.creditor}`,
        amount: h.amount,
        date: h.date,
      });
    }
    if (d.status === "pago") {
      const last = d.history?.[d.history.length - 1];
      events.push({
        id: `quit-${d.id}`,
        kind: "divida_quitada",
        title: `Dívida a ${d.creditor} quitada`,
        amount: d.totalAmount,
        date: last?.date ?? d.dueDate,
      });
    }
  }

  // Metas concluídas
  for (const g of snapshot.goals) {
    if (g.status === "concluida") {
      events.push({
        id: `goal-${g.id}`,
        kind: "meta_atingida",
        title: `Meta atingida: ${g.title}`,
        amount: g.targetAmount,
        date: g.deadline ?? iso(new Date()),
      });
    }
  }

  return events
    .filter((e) => !!e.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

// ── Notificações ────────────────────────────────────────────────
export function deriveNotifications(
  snapshot: FinancialSnapshot,
  ref: Date = new Date(),
): SmartNotification[] {
  const out: SmartNotification[] = [];

  // Salário a chegar (até 3 dias)
  for (const s of snapshot.salaries.filter((x) => x.active)) {
    const next = nextOccurrence(s.payDay, ref);
    const days = daysUntil(next, ref);
    if (days >= 0 && days <= 3) {
      out.push({
        id: `n-sal-${s.id}`,
        level: "info",
        title: days === 0 ? "Salário chega hoje" : `Salário em ${days} dia${days === 1 ? "" : "s"}`,
        body: `${s.label}: ${formatCurrency(s.amount)}. Prepare a distribuição no wizard.`,
        date: iso(ref),
        read: false,
        href: "/salario",
      });
    }
  }

  // Pagamentos recorrentes a vencer (até 2 dias)
  for (const r of snapshot.recurring.filter((x) => x.active)) {
    const next = nextOccurrence(r.dayOfMonth, ref);
    const days = daysUntil(next, ref);
    if (days >= 0 && days <= 2) {
      out.push({
        id: `n-rec-${r.id}`,
        level: "aviso",
        title:
          days === 0
            ? `${r.label} vence hoje`
            : days === 1
              ? `${r.label} vence amanhã`
              : `${r.label} vence em 2 dias`,
        body: `Valor: ${formatCurrency(r.amount)} (dia ${r.dayOfMonth}).`,
        date: iso(ref),
        read: false,
        href: "/calendario",
      });
    }
  }

  // Dívidas em atraso ou a vencer (até 3 dias)
  for (const d of snapshot.debts.filter((x) => x.status !== "pago")) {
    if (!d.dueDate) continue;
    const days = daysUntil(new Date(d.dueDate), ref);
    const outstanding = d.totalAmount - d.paidAmount;
    if (days < 0) {
      out.push({
        id: `n-debt-${d.id}`,
        level: "perigo",
        title: `Dívida a ${d.creditor} em atraso`,
        body: `Em aberto: ${formatCurrency(outstanding)}. Priorize este pagamento.`,
        date: iso(ref),
        read: false,
        href: "/dividas",
      });
    } else if (days <= 3) {
      out.push({
        id: `n-debt-${d.id}`,
        level: "aviso",
        title: `Dívida a ${d.creditor} vence ${days === 0 ? "hoje" : `em ${days} dia${days === 1 ? "" : "s"}`}`,
        body: `Em aberto: ${formatCurrency(outstanding)}.`,
        date: iso(ref),
        read: false,
        href: "/dividas",
      });
    }
  }

  // Metas concluídas (celebração)
  for (const g of snapshot.goals.filter((x) => x.status === "concluida")) {
    out.push({
      id: `n-goal-${g.id}`,
      level: "sucesso",
      title: `Meta "${g.title}" concluída`,
      body: `Parabéns! Atingiu ${formatCurrency(g.targetAmount)}.`,
      date: g.deadline ?? iso(ref),
      read: false,
      href: "/metas",
    });
  }

  return out.slice(0, 12);
}

// ── Conquistas ──────────────────────────────────────────────────
export function deriveAchievements(snapshot: FinancialSnapshot): Achievement[] {
  const savings = snapshot.accounts
    .filter((a) => a.kind === "poupanca" || a.kind === "investimento")
    .reduce((s, a) => s + a.balance, 0);

  const openDebts = snapshot.debts.filter((d) => d.status !== "pago");
  const totalDebt = snapshot.debts.reduce((s, d) => s + d.totalAmount, 0);
  const paidDebt = snapshot.debts.reduce((s, d) => s + d.paidAmount, 0);
  const debtProgress = totalDebt > 0 ? paidDebt / totalDebt : openDebts.length === 0 ? 1 : 0;

  const goalDone = snapshot.goals.some((g) => g.status === "concluida");
  const bestGoal = snapshot.goals.reduce(
    (best, g) => Math.max(best, g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0),
    0,
  );

  const threshold = (target: number): Pick<Achievement, "unlocked" | "progress"> => ({
    unlocked: savings >= target,
    progress: Math.min(1, savings / target),
  });

  return [
    {
      id: "primeira_poupanca",
      title: "Primeira poupança",
      description: "Guardou dinheiro pela primeira vez",
      icon: "Sparkles",
      unlocked: savings > 0,
      progress: savings > 0 ? 1 : 0,
    },
    { id: "cem_mil", title: "100 mil", description: "Atingiu 100 000 Kz em poupança", icon: "Coins", ...threshold(100_000) },
    { id: "quinhentos_mil", title: "500 mil", description: "Atingiu 500 000 Kz em poupança", icon: "Medal", ...threshold(500_000) },
    { id: "um_milhao", title: "Primeiro milhão", description: "Atingiu 1 000 000 Kz em poupança", icon: "Trophy", ...threshold(1_000_000) },
    {
      id: "mes_sem_emprestimos",
      title: "Livre de dívidas",
      description: "Todas as dívidas quitadas",
      icon: "ShieldCheck",
      unlocked: snapshot.debts.length > 0 && openDebts.length === 0,
      progress: debtProgress,
    },
    {
      id: "meta_concluida",
      title: "Meta concluída",
      description: "Concluiu a sua primeira meta",
      icon: "Target",
      unlocked: goalDone,
      progress: goalDone ? 1 : bestGoal,
    },
    {
      id: "sequencia_registos",
      title: "Sequência de 30 dias",
      description: "Registou movimentos 30 dias seguidos",
      icon: "Flame",
      unlocked: snapshot.profile.streak >= 30,
      progress: Math.min(1, snapshot.profile.streak / 30),
    },
  ];
}
