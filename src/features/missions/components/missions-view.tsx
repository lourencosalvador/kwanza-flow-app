"use client";

import { motion } from "framer-motion";
import { Flag, Sparkles, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ClearAllButton } from "@/components/shared/clear-all-button";
import { AddMissionDialog } from "@/features/missions/components/add-mission-dialog";
import { useFinancialStore } from "@/store/financial-store";
import { useFinancialReport, useMounted } from "@/hooks/use-financial-report";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function MissionsView() {
  const mounted = useMounted();
  const missions = useFinancialStore((s) => s.snapshot.missions);
  const setPrimary = useFinancialStore((s) => s.setPrimaryMission);
  const report = useFinancialReport();

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  const primary = missions.find((m) => m.isPrimary && m.status === "ativa");
  const others = missions.filter((m) => m.id !== primary?.id);
  const savings = report.netWorth.savings + report.netWorth.investments;

  return (
    <div>
      <PageHeader
        title="Modo Missão"
        description="A sua missão guia cada decisão. O consultor acompanha-a em todo o sistema."
        action={
          <>
            <ClearAllButton domain="missions" itemsLabel="todas as suas missões" count={missions.length} />
            <AddMissionDialog />
          </>
        }
      />

      {missions.length === 0 ? (
        <EmptyState icon="Flag" title="Defina a sua missão" description="Eliminar dívidas, guardar 3 milhões, comprar um carro… o sistema acompanha." />
      ) : (
        <div className="space-y-4">
          {primary && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="relative overflow-hidden border-primary/30 gap-0">
                <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/15 blur-3xl" />
                <CardContent className="p-6">
                  <Badge variant="default" className="gap-1">
                    <Star className="size-3" /> Missão principal
                  </Badge>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">{primary.title}</h3>

                  {primary.targetAmount && (
                    <>
                      <div className="mt-5 flex items-end justify-between">
                        <span className="text-2xl font-semibold text-primary tabular-nums">
                          {formatCurrency(savings)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          de {formatCurrency(primary.targetAmount)}
                          {primary.deadline ? ` · até ${formatDate(primary.deadline)}` : ""}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, Math.round((savings / primary.targetAmount) * 100))}
                        className="mt-3 h-2.5"
                      />
                    </>
                  )}

                  <div className="mt-5 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.06] p-3 text-sm">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-muted-foreground text-balance">
                      Ao ritmo atual de {formatCurrency(report.cashFlow.monthlyCapacity)}/mês,
                      mantém-se {report.goals[0]?.onTrack ? "no bom caminho" : "ligeiramente atrasado"}.
                      Antes de cada despesa importante, pergunte-se: <span className="font-medium text-foreground">isto aproxima-me ou afasta-me desta missão?</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {others.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((m) => (
                <Card key={m.id} className="gap-0">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Flag className="size-4" />
                      {m.status === "concluida" ? "Concluída" : "Ativa"}
                    </div>
                    <p className="mt-2 font-medium">{m.title}</p>
                    {m.targetAmount && (
                      <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                        Alvo: {formatCurrency(m.targetAmount)}
                      </p>
                    )}
                    {!m.isPrimary && m.status === "ativa" && (
                      <Button variant="outline" size="sm" className="mt-4 w-full gap-1.5" onClick={() => setPrimary(m.id)}>
                        <Star className="size-3.5" /> Tornar principal
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
