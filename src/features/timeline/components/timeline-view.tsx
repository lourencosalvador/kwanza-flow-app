"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/icon";
import { deriveTimeline } from "@/lib/derive";
import { useMounted, useSnapshot } from "@/hooks/use-financial-report";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { TimelineEventKind } from "@/types/domain";

const KIND_META: Record<TimelineEventKind, { icon: string; color: string }> = {
  salario: { icon: "Banknote", color: "var(--chart-1)" },
  divida_quitada: { icon: "TrendingDown", color: "var(--chart-5)" },
  fundo_emergencia: { icon: "ShieldCheck", color: "var(--chart-2)" },
  marco: { icon: "Trophy", color: "var(--chart-3)" },
  meta_atingida: { icon: "Target", color: "var(--chart-4)" },
  missao: { icon: "Flag", color: "var(--primary)" },
};

export function TimelineView() {
  const mounted = useMounted();
  const snapshot = useSnapshot();
  const events = React.useMemo(() => deriveTimeline(snapshot), [snapshot]);

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  if (events.length === 0) {
    return (
      <div>
        <PageHeader title="Timeline" description="A história da sua evolução financeira." />
        <EmptyState
          icon="GitCommitVertical"
          title="A sua história começa agora"
          description="Cada salário recebido, dívida paga e meta atingida aparece aqui automaticamente."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Timeline" description="A história da sua evolução financeira." />

      <div className="relative ml-2">
        <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border" />
        <ul className="space-y-5">
          {events.map((e, i) => {
            const meta = KIND_META[e.kind];
            return (
              <motion.li
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative flex gap-4 pl-1"
              >
                <span
                  className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background"
                  style={{ backgroundColor: `color-mix(in oklch, ${meta.color} 18%, transparent)`, color: meta.color }}
                >
                  <Icon name={meta.icon} className="size-4" />
                </span>
                <div className="flex-1 rounded-xl border border-border/70 bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{e.title}</p>
                    {e.amount != null && (
                      <span className="text-sm font-semibold tabular-nums" style={{ color: meta.color }}>
                        {formatCurrency(e.amount)}
                      </span>
                    )}
                  </div>
                  {e.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{e.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(e.date, "long")}</p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
