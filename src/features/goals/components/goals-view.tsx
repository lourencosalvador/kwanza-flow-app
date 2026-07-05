"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ClearAllButton } from "@/components/shared/clear-all-button";
import { AddGoalDialog } from "@/features/goals/components/add-goal-dialog";
import { useFinancialStore } from "@/store/financial-store";
import { useFinancialReport, useMounted } from "@/hooks/use-financial-report";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function GoalsView() {
  const mounted = useMounted();
  const goals = useFinancialStore((s) => s.snapshot.goals);
  const contribute = useFinancialStore((s) => s.contributeToGoal);
  const report = useFinancialReport();

  const [activeGoal, setActiveGoal] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState<number>(0);

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  function applyContribution() {
    if (!activeGoal || amount <= 0) return;
    contribute(activeGoal, amount);
    toast.success("Reforço aplicado", { description: formatCurrency(amount) });
    setActiveGoal(null);
    setAmount(0);
  }

  return (
    <div>
      <PageHeader
        title="Metas"
        description="Defina objetivos e veja a previsão automática de conclusão."
        action={
          <>
            <ClearAllButton domain="goals" itemsLabel="todas as suas metas" count={goals.length} />
            <AddGoalDialog />
          </>
        }
      />

      {goals.length === 0 ? (
        <EmptyState icon="Target" title="Ainda sem metas" description="Crie a sua primeira meta e o motor calcula quando a atinge." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g, i) => {
            const projection = report.goals.find((p) => p.id === g.id);
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Card className="gap-0">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium">{g.title}</p>
                        {g.description && (
                          <p className="truncate text-xs text-muted-foreground">{g.description}</p>
                        )}
                      </div>
                      {g.status === "concluida" ? (
                        <Badge variant="success">Concluída</Badge>
                      ) : projection?.onTrack ? (
                        <Badge variant="default">No caminho</Badge>
                      ) : (
                        <Badge variant="warning">Atrasada</Badge>
                      )}
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <span className="text-xl font-semibold tabular-nums" style={{ color: g.color }}>
                        {formatCurrency(g.currentAmount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        de {formatCurrency(g.targetAmount)}
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2 h-2" indicatorClassName="" />

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{pct}%</span>
                      {projection?.monthsToComplete != null && g.status !== "concluida" && (
                        <span>
                          ~{projection.monthsToComplete} meses
                          {projection.projectedDate ? ` · ${formatDate(projection.projectedDate)}` : ""}
                        </span>
                      )}
                    </div>

                    {g.status !== "concluida" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full gap-1.5"
                        onClick={() => {
                          setActiveGoal(g.id);
                          setAmount(g.monthlyContribution ?? 0);
                        }}
                      >
                        <Plus className="size-3.5" /> Reforçar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={!!activeGoal} onOpenChange={(o) => !o && setActiveGoal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reforçar meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-12 text-lg tabular-nums"
              autoFocus
            />
            <Button className="w-full" onClick={applyContribution}>
              Adicionar {amount > 0 ? formatCurrency(amount) : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
