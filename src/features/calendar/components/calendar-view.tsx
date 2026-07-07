"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { useFinancialStore } from "@/store/financial-store";
import { useMounted } from "@/hooks/use-financial-report";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface DayEvent {
  label: string;
  amount: number;
  type: "salario" | "despesa";
}

export function CalendarView() {
  const mounted = useMounted();
  const snapshot = useFinancialStore((s) => s.snapshot);

  const { weeks, eventsByDay, monthLabel } = React.useMemo(() => {
    const ref = new Date();
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Segunda = 0
    const startOffset = (first.getDay() + 6) % 7;

    const map = new Map<number, DayEvent[]>();
    snapshot.salaries
      .filter((s) => s.active)
      .forEach((s) => {
        const arr = map.get(s.payDay) ?? [];
        arr.push({ label: s.label, amount: s.amount, type: "salario" });
        map.set(s.payDay, arr);
      });
    snapshot.recurring
      .filter((r) => r.active)
      .forEach((r) => {
        const arr = map.get(r.dayOfMonth) ?? [];
        arr.push({ label: r.label, amount: r.amount, type: "despesa" });
        map.set(r.dayOfMonth, arr);
      });

    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return {
      weeks,
      eventsByDay: map,
      monthLabel: formatDate(ref, "month"),
    };
  }, [snapshot]);

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  const today = new Date().getDate();

  return (
    <div>
      <PageHeader title="Calendário" description={`Compromissos de ${monthLabel}: salários, rendas e pagamentos.`} />

      <Card className="gap-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="pb-1 text-center text-xs font-medium text-muted-foreground">
                {w}
              </div>
            ))}
            {weeks.flat().map((day, i) => {
              const events = day ? eventsByDay.get(day) ?? [] : [];
              const isToday = day === today;
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-20 rounded-lg border p-1.5 text-left",
                    day ? "border-border/70" : "border-transparent",
                    isToday && "border-primary/50 bg-primary/[0.04]",
                  )}
                >
                  {day && (
                    <>
                      <span className={cn("text-xs", isToday ? "font-semibold text-primary" : "text-muted-foreground")}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {events.slice(0, 2).map((e, j) => (
                          <div
                            key={j}
                            className={cn(
                              "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                              e.type === "salario"
                                ? "bg-success/15 text-success"
                                : "bg-muted text-muted-foreground",
                            )}
                            title={`${e.label} · ${formatCurrency(e.amount)}`}
                          >
                            {e.label}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{events.length - 2}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-success" /> Salário
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground" /> Pagamento
        </span>
      </div>
    </div>
  );
}
