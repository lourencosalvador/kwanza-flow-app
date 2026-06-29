"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PlanTask {
  id: string;
  label: string;
  done: boolean;
}
interface Plan {
  id: string;
  title: string;
  period: string;
  budget: number;
  tasks: PlanTask[];
}

const SEED_PLANS: Plan[] = [
  {
    id: "p-julho",
    title: "Plano Julho",
    period: "Mensal",
    budget: 850_000,
    tasks: [
      { id: "t1", label: "Pagar renda até dia 5", done: true },
      { id: "t2", label: "Guardar 150 000 Kz para o carro", done: true },
      { id: "t3", label: "Abater 50 000 Kz no cartão BAI", done: false },
      { id: "t4", label: "Manter lazer abaixo de 40 000 Kz", done: false },
    ],
  },
  {
    id: "p-viagem",
    title: "Plano Viagem",
    period: "Objetivo",
    budget: 1_200_000,
    tasks: [
      { id: "t1", label: "Definir destino e datas", done: true },
      { id: "t2", label: "Reservar bilhetes", done: false },
      { id: "t3", label: "Poupar 1.2M até dezembro", done: false },
    ],
  },
  {
    id: "p-casa",
    title: "Plano Casa",
    period: "Longo prazo",
    budget: 8_000_000,
    tasks: [
      { id: "t1", label: "Reunir entrada (20%)", done: false },
      { id: "t2", label: "Simular crédito habitação", done: false },
      { id: "t3", label: "Escolher zona", done: true },
    ],
  },
];

export function PlanningView() {
  const [plans, setPlans] = React.useState<Plan[]>(SEED_PLANS);

  function toggle(planId: string, taskId: string) {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t,
              ),
            }
          : p,
      ),
    );
  }

  return (
    <div>
      <PageHeader title="Planeamento" description="Organize objetivos, tarefas e checklists por plano." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, i) => {
          const done = plan.tasks.filter((t) => t.done).length;
          const pct = Math.round((done / plan.tasks.length) * 100);
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
                    <Badge variant="secondary">{plan.period}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    Orçamento: {formatCurrency(plan.budget)}
                  </p>
                </CardHeader>
                <CardContent className="pt-2">
                  <Progress value={pct} className="h-1.5" />
                  <p className="mt-1.5 text-xs text-muted-foreground">{pct}% concluído</p>
                  <ul className="mt-3 space-y-1">
                    {plan.tasks.map((t) => (
                      <li key={t.id}>
                        <button
                          onClick={() => toggle(plan.id, t.id)}
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
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
