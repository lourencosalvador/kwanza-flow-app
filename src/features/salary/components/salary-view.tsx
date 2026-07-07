"use client";

import * as React from "react";
import { Banknote, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/shared/page-header";
import { EntityMenu } from "@/components/shared/entity-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { SalaryDialog } from "@/features/salary/components/salary-dialog";
import { RecurringDialog } from "@/features/salary/components/recurring-dialog";
import { useFinancialStore } from "@/store/financial-store";
import { useFinancialReport, useMounted } from "@/hooks/use-financial-report";
import { useUIStore } from "@/store/ui-store";
import { getCategory } from "@/config/categories";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecurringPayment, Salary } from "@/types/domain";

const FREQ_LABEL: Record<string, string> = {
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  personalizado: "Personalizado",
};

export function SalaryView() {
  const mounted = useMounted();
  const snapshot = useFinancialStore((s) => s.snapshot);
  const deleteSalary = useFinancialStore((s) => s.deleteSalary);
  const deleteRecurring = useFinancialStore((s) => s.deleteRecurring);
  const report = useFinancialReport();
  const openWizard = useUIStore((s) => s.setSalaryWizard);

  const [editingSalary, setEditingSalary] = React.useState<Salary | null>(null);
  const [editingRecurring, setEditingRecurring] = React.useState<RecurringPayment | null>(null);

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  return (
    <div>
      <PageHeader
        title="Salário"
        description="Configure os seus rendimentos e despesas fixas. Tudo editável."
        action={
          <>
            <SalaryDialog />
            <Button className="gap-2" onClick={() => openWizard(true)}>
              <Banknote className="size-4" /> Recebi salário
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          {snapshot.salaries.length === 0 && (
            <EmptyState
              icon="Banknote"
              title="Sem salário configurado"
              description='Crie o seu salário em "Novo salário" para ativar o wizard e as previsões.'
            />
          )}

          {snapshot.salaries.map((s) => (
            <Card key={s.id} className="relative overflow-hidden gap-0">
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-primary/10 blur-2xl" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <Badge variant={s.active ? "default" : "secondary"}>
                    {FREQ_LABEL[s.frequency]}
                    {!s.active && " · inativo"}
                  </Badge>
                  <EntityMenu
                    label={`o salário "${s.label}"`}
                    onEdit={() => setEditingSalary(s)}
                    onDelete={() => {
                      deleteSalary(s.id);
                      toast.success("Salário removido", { description: s.label });
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {formatCurrency(s.amount)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Recebe no dia {s.payDay}
                  {s.frequency === "quinzenal"
                    ? " (a cada duas semanas)"
                    : s.frequency === "semanal"
                      ? " (todas as semanas)"
                      : " de cada mês"}
                </p>
              </CardContent>
            </Card>
          ))}

          <Card className="gap-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Capacidade de poupança</p>
              <p className="text-2xl font-semibold text-primary tabular-nums">
                {formatCurrency(report.cashFlow.monthlyCapacity)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                após {formatCurrency(report.cashFlow.fixedMonthlyExpenses)} de despesas fixas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recorrentes */}
        <Card className="gap-0 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-4" /> Pagamentos recorrentes
            </CardTitle>
            <RecurringDialog />
          </CardHeader>
          <CardContent className="space-y-1 pt-2">
            {snapshot.recurring.length === 0 && (
              <p className="rounded-lg bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                Sem pagamentos recorrentes. Adicione a renda, internet, energia…
              </p>
            )}

            {snapshot.recurring.map((r) => {
              const cat = getCategory(r.category);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                >
                  <span
                    className="flex size-9 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${cat.color} 18%, transparent)`,
                      color: cat.color,
                    }}
                  >
                    <Icon name={cat.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {r.label}
                      {!r.active && (
                        <span className="ml-2 text-xs text-muted-foreground">(inativo)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Dia {r.dayOfMonth}</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(r.amount)}
                  </span>
                  <EntityMenu
                    label={`o pagamento "${r.label}"`}
                    onEdit={() => setEditingRecurring(r)}
                    onDelete={() => {
                      deleteRecurring(r.id);
                      toast.success("Pagamento removido", { description: r.label });
                    }}
                  />
                </div>
              );
            })}

            {snapshot.recurring.length > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-medium">Total mensal fixo</span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(report.cashFlow.fixedMonthlyExpenses)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editingSalary && (
        <SalaryDialog
          salary={editingSalary}
          open={!!editingSalary}
          onOpenChange={(o) => !o && setEditingSalary(null)}
        />
      )}
      {editingRecurring && (
        <RecurringDialog
          payment={editingRecurring}
          open={!!editingRecurring}
          onOpenChange={(o) => !o && setEditingRecurring(null)}
        />
      )}
    </div>
  );
}
