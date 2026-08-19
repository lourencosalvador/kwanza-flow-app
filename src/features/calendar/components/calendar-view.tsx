"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarEventDialog } from "@/features/calendar/components/calendar-event-dialog";
import { useFinancialStore } from "@/store/financial-store";
import { useMounted } from "@/hooks/use-financial-report";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarEvent } from "@/types/domain";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

type EventKind = "salario" | "despesa" | "entrada" | "saida" | "lembrete";

interface DayEvent {
  label: string;
  amount?: number;
  kind: EventKind;
  event?: CalendarEvent; // presente = evento do utilizador (editável)
}

const KIND_STYLE: Record<EventKind, string> = {
  salario: "bg-success/15 text-success",
  entrada: "bg-success/15 text-success",
  despesa: "bg-muted text-muted-foreground",
  saida: "bg-destructive/12 text-destructive",
  lembrete: "bg-today/12 text-today",
};

const pad = (n: number) => String(n).padStart(2, "0");

export function CalendarView() {
  const mounted = useMounted();
  const snapshot = useFinancialStore((s) => s.snapshot);
  const [offset, setOffset] = React.useState(0);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogDate, setDialogDate] = React.useState<string | undefined>();
  const [dialogEvent, setDialogEvent] = React.useState<CalendarEvent | null>(null);

  const { weeks, eventsByDay, monthLabel, year, month, isCurrentMonth } =
    React.useMemo(() => {
      const now = new Date();
      const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const year = ref.getFullYear();
      const month = ref.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startOffset = (new Date(year, month, 1).getDay() + 6) % 7; // Segunda = 0

      const map = new Map<number, DayEvent[]>();
      const add = (day: number, ev: DayEvent) => {
        const arr = map.get(day) ?? [];
        arr.push(ev);
        map.set(day, arr);
      };

      // Derivados (recorrem todos os meses)
      snapshot.salaries
        .filter((s) => s.active)
        .forEach((s) => add(s.payDay, { label: s.label, amount: s.amount, kind: "salario" }));
      snapshot.recurring
        .filter((r) => r.active)
        .forEach((r) => add(r.dayOfMonth, { label: r.label, amount: r.amount, kind: "despesa" }));

      // Eventos do utilizador (por data, só os do mês visível)
      snapshot.calendarEvents.forEach((ev) => {
        const [y, m, d] = ev.date.split("-").map(Number);
        if (y === year && m - 1 === month) {
          add(d, { label: ev.title, amount: ev.amount, kind: ev.kind, event: ev });
        }
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
        year,
        month,
        isCurrentMonth: offset === 0,
      };
    }, [snapshot, offset]);

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  const today = new Date().getDate();

  function openAdd(day: number) {
    setDialogEvent(null);
    setDialogDate(`${year}-${pad(month + 1)}-${pad(day)}`);
    setDialogOpen(true);
  }
  function openEdit(ev: CalendarEvent) {
    setDialogDate(undefined);
    setDialogEvent(ev);
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Calendário"
        description="Salários e pagamentos são automáticos. Adiciona os teus próprios eventos e lembretes."
        action={
          <Button
            className="gap-1.5"
            onClick={() => {
              setDialogEvent(null);
              setDialogDate(`${year}-${pad(month + 1)}-${pad(Math.min(today, 28))}`);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> Novo evento
          </Button>
        }
      />

      <Card className="gap-0">
        <CardContent className="p-4">
          {/* Navegação de mês */}
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="icon-sm" onClick={() => setOffset((o) => o - 1)} aria-label="Mês anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <p className="text-sm font-medium capitalize">{monthLabel}</p>
            <Button variant="ghost" size="icon-sm" onClick={() => setOffset((o) => o + 1)} aria-label="Mês seguinte">
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="pb-1 text-center text-xs font-medium text-muted-foreground">
                {w}
              </div>
            ))}
            {weeks.flat().map((day, i) => {
              const events = day ? eventsByDay.get(day) ?? [] : [];
              const isToday = isCurrentMonth && day === today;
              return (
                <div
                  key={i}
                  onClick={day ? () => openAdd(day) : undefined}
                  className={cn(
                    "min-h-20 rounded-lg border p-1.5 text-left transition-colors",
                    day ? "cursor-pointer border-border/70 hover:border-primary/40" : "border-transparent",
                    isToday && "border-today/50 bg-today/[0.06]",
                  )}
                >
                  {day && (
                    <>
                      {isToday ? (
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-today text-[11px] font-semibold text-white">
                          {day}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{day}</span>
                      )}
                      <div className="mt-1 space-y-1">
                        {events.slice(0, 3).map((e, j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={
                              e.event
                                ? (clickEv) => {
                                    clickEv.stopPropagation();
                                    openEdit(e.event!);
                                  }
                                : undefined
                            }
                            className={cn(
                              "block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium",
                              KIND_STYLE[e.kind],
                              e.event ? "cursor-pointer hover:opacity-80" : "cursor-default",
                            )}
                            title={`${e.label}${e.amount != null ? ` · ${formatCurrency(e.amount)}` : ""}`}
                          >
                            {e.label}
                          </button>
                        ))}
                        {events.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{events.length - 3}</span>
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

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <Legend color="bg-success" label="Salário / Entrada" />
        <Legend color="bg-muted-foreground" label="Pagamento" />
        <Legend color="bg-destructive" label="Saída" />
        <Legend color="bg-today" label="Lembrete / Hoje" />
      </div>

      <CalendarEventDialog
        event={dialogEvent ?? undefined}
        defaultDate={dialogDate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", color)} /> {label}
    </span>
  );
}
