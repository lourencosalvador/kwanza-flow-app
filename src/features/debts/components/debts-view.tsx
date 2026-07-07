"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ClearAllButton } from "@/components/shared/clear-all-button";
import { EntityMenu } from "@/components/shared/entity-menu";
import { DebtDialog } from "@/features/debts/components/debt-dialog";
import { PayDebtDialog } from "@/features/debts/components/pay-debt-dialog";
import { useFinancialStore } from "@/store/financial-store";
import { useFinancialReport, useMounted } from "@/hooks/use-financial-report";
import { formatCurrency, formatCompact, formatDate, formatMonths } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Debt, Priority } from "@/types/domain";

const PRIORITY_VARIANT: Record<Priority, "destructive" | "warning" | "secondary"> = {
  critica: "destructive",
  alta: "destructive",
  media: "warning",
  baixa: "secondary",
};

export function DebtsView() {
  const mounted = useMounted();
  const debts = useFinancialStore((s) => s.snapshot.debts);
  const deleteDebt = useFinancialStore((s) => s.deleteDebt);
  const report = useFinancialReport();
  const [editing, setEditing] = React.useState<Debt | null>(null);

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  const open = debts.filter((d) => d.status !== "pago");

  return (
    <div>
      <PageHeader
        title="Dívidas"
        description="Acompanhe a evolução e siga a estratégia de quitação."
        action={
          <>
            <ClearAllButton domain="debts" itemsLabel="todas as suas dívidas" count={debts.length} />
            <DebtDialog />
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Em aberto" value={formatCurrency(report.debts.totalOutstanding)} icon="TrendingDown" accent={report.debts.totalOutstanding > 0 ? "danger" : "default"} index={0} />
        <StatCard label="Já pago" value={formatCurrency(report.debts.totalPaid)} icon="CheckCircle2" accent="primary" index={1} />
        <StatCard label="Progresso" value={`${Math.round(report.debts.paidShare * 100)}%`} icon="BarChart3" index={2} />
        <StatCard label="Tempo p/ zerar" value={formatMonths(report.debts.monthsToDebtFree)} icon="CalendarDays" index={3} hint="ritmo atual" />
      </div>

      {open.length === 0 ? (
        <EmptyState
          icon="CheckCircle2"
          title="Sem dívidas em aberto"
          description="Parabéns! Está livre de dívidas. Foque-se em construir património."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Gráfico de redução */}
          <Card className="gap-0 lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Redução projetada</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.debts.reductionSeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => formatCompact(v).replace(" Kz", "")} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="outstanding" stroke="var(--chart-5)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Estratégia de pagamento */}
          <Card className="gap-0 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ordem sugerida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {report.debts.payoffOrder.map((d, i) => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.creditor}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(d.outstanding)}
                    </p>
                  </div>
                  <Badge variant={PRIORITY_VARIANT[d.priority]}>{d.priority}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Lista detalhada */}
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5">
            {open.map((d) => {
              const pct = Math.round((d.paidAmount / d.totalAmount) * 100);
              return (
                <Card key={d.id} className="gap-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{d.creditor}</p>
                      <div className="flex items-center gap-1">
                        <Badge variant={PRIORITY_VARIANT[d.priority]}>{d.priority}</Badge>
                        <EntityMenu
                          label={`a dívida a "${d.creditor}"`}
                          onEdit={() => setEditing(d)}
                          onDelete={() => {
                            deleteDebt(d.id);
                            toast.success("Dívida removida", { description: d.creditor });
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-lg font-semibold tabular-nums">
                        {formatCurrency(d.totalAmount - d.paidAmount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        de {formatCurrency(d.totalAmount)}
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2 h-1.5" />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>{pct}% pago · {d.paidInstallments}/{d.installments} parcelas</span>
                      <span>vence {formatDate(d.dueDate)}</span>
                    </div>
                    <div className="mt-3">
                      <PayDebtDialog debt={d} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {editing && (
        <DebtDialog
          debt={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </div>
  );
}
