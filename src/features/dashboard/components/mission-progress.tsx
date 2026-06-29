"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flag, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useFinancialStore } from "@/store/financial-store";
import { useFinancialReport } from "@/hooks/use-financial-report";
import { formatCurrency } from "@/lib/format";

export function MissionProgress() {
  const missions = useFinancialStore((s) => s.snapshot.missions);
  const report = useFinancialReport();
  const primary = missions.find((m) => m.isPrimary && m.status === "ativa");

  if (!primary) return null;

  const current = report.netWorth.savings + report.netWorth.investments;
  const target = primary.targetAmount ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <Card className="relative overflow-hidden gap-0">
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Flag className="size-4" /> Missão principal
        </div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight">
          {primary.title}
        </h3>

        {target > 0 && (
          <>
            <div className="mt-4 flex items-end justify-between">
              <span className="text-2xl font-semibold tabular-nums">
                {formatCurrency(current)}
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                de {formatCurrency(target)}
              </span>
            </div>
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Progress value={pct} className="mt-3 h-2.5" />
            </motion.div>
            <p className="mt-2 text-sm text-muted-foreground">
              {pct}% concluído · faltam {formatCurrency(Math.max(0, target - current))}
            </p>
          </>
        )}

        <Button asChild variant="outline" size="sm" className="mt-4 gap-1.5">
          <Link href="/missoes">
            Ver missões <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
