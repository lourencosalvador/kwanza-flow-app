import type { FinancialSnapshot } from "@/types/domain";

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export interface CashflowPoint {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

/** Série mensal de receitas/despesas dos últimos N meses, a partir das transações. */
export function buildCashflowSeries(
  snapshot: FinancialSnapshot,
  months = 6,
  ref: Date = new Date(),
): CashflowPoint[] {
  const points: CashflowPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const inMonth = snapshot.transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getFullYear() === y && td.getMonth() === m;
    });
    // Apenas dados reais: meses sem transações aparecem a zero.
    const receitas = inMonth
      .filter((t) => t.type === "receita")
      .reduce((s, t) => s + t.amount, 0);
    const despesas = inMonth
      .filter((t) => t.type === "despesa")
      .reduce((s, t) => s + t.amount, 0);

    points.push({
      month: MONTH_LABELS[m],
      receitas,
      despesas,
      saldo: receitas - despesas,
    });
  }
  return points;
}

export interface UpcomingItem {
  label: string;
  amount: number;
  date: Date;
  kind: "salario" | "renda" | "recorrente";
  icon: string;
}

/** Calcula próximos eventos (salário, renda, próximo recorrente) a partir de hoje. */
export function buildUpcoming(
  snapshot: FinancialSnapshot,
  ref: Date = new Date(),
): UpcomingItem[] {
  const items: UpcomingItem[] = [];

  function nextDate(day: number): Date {
    const d = new Date(ref.getFullYear(), ref.getMonth(), day);
    if (d < ref) d.setMonth(d.getMonth() + 1);
    return d;
  }

  const salary = snapshot.salaries.find((s) => s.active);
  if (salary) {
    items.push({
      label: salary.label,
      amount: salary.amount,
      date: nextDate(salary.payDay),
      kind: "salario",
      icon: "Banknote",
    });
  }

  const renda = snapshot.recurring.find((r) => r.kind === "renda" && r.active);
  if (renda) {
    items.push({
      label: renda.label,
      amount: renda.amount,
      date: nextDate(renda.dayOfMonth),
      kind: "renda",
      icon: "KeyRound",
    });
  }

  // Próximo pagamento recorrente (excluindo renda) mais próximo.
  const others = snapshot.recurring
    .filter((r) => r.active && r.kind !== "renda")
    .map((r) => ({
      label: r.label,
      amount: r.amount,
      date: nextDate(r.dayOfMonth),
      kind: "recorrente" as const,
      icon: "Receipt",
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (others[0]) items.push(others[0]);

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}
