"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityMenu } from "@/components/shared/entity-menu";
import { PlanDialog } from "@/features/planning/components/plan-dialog";
import { useFinancialStore } from "@/store/financial-store";
import { useMounted } from "@/hooks/use-financial-report";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Plan } from "@/types/domain";

export function PlanningView() {
  const mounted = useMounted();
  const plans = useFinancialStore((s) => s.snapshot.plans);
  const updatePlan = useFinancialStore((s) => s.updatePlan);
  const deletePlan = useFinancialStore((s) => s.deletePlan);
  const [editing, setEditing] = React.useState<Plan | null>(null);

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  function toggleTask(plan: Plan, taskId: string) {
    updatePlan(plan.id, {
      tasks: plan.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    });
  }

  return (
    <div>
      <PageHeader
        title="Planeamento"
        description="Organize objetivos, tarefas e checklists por plano. Tudo editável."
        action={<PlanDialog />}
      />

      {plans.length === 0 ? (
        <EmptyState
          icon="ClipboardList"
          title="Ainda sem planos"
          description='Crie o seu primeiro plano em "Novo plano": defina o orçamento e a checklist de tarefas.'
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const done = plan.tasks.filter((t) => t.done).length;
            const pct = plan.tasks.length > 0 ? Math.round((done / plan.tasks.length) * 100) : 0;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="gap-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{plan.title}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary">{plan.period}</Badge>
                        <EntityMenu
                          label={`o plano "${plan.title}"`}
                          onEdit={() => setEditing(plan)}
                          onDelete={() => {
                            deletePlan(plan.id);
                            toast.success("Plano removido", { description: plan.title });
                          }}
                        />
                      </div>
                    </div>
                    {plan.budget > 0 && (
                      <p className="text-sm text-muted-foreground tabular-nums">
                        Orçamento: {formatCurrency(plan.budget)}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-2">
                    {plan.tasks.length > 0 ? (
                      <>
                        <Progress value={pct} className="h-1.5" />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {pct}% concluído · {done}/{plan.tasks.length} tarefas
                        </p>
                        <ul className="mt-3 space-y-1">
                          {plan.tasks.map((t) => (
                            <li key={t.id}>
                              <button
                                onClick={() => toggleTask(plan, t.id)}
                                className="flex w-full items-center gap-2.5 rounded-md px-1 py-1.5 text-left text-sm transition-colors hover:bg-accent/50"
                              >
                                <span
                                  className={cn(
                                    "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                                    t.done
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border",
                                  )}
                                >
                                  {t.done && <Check className="size-3" />}
                                </span>
                                <span className={cn(t.done && "text-muted-foreground line-through")}>
                                  {t.label}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Sem tarefas. Edite o plano para adicionar a checklist.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {editing && (
        <PlanDialog
          plan={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </div>
  );
}
