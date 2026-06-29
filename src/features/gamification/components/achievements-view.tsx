"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/icon";
import { buildAchievements } from "@/lib/mock/seed";
import { useFinancialStore } from "@/store/financial-store";
import { useMounted } from "@/hooks/use-financial-report";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function AchievementsView() {
  const mounted = useMounted();
  const profile = useFinancialStore((s) => s.snapshot.profile);
  const achievements = React.useMemo(() => buildAchievements(), []);

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <PageHeader
        title="Conquistas"
        description={`${unlocked} de ${achievements.length} desbloqueadas`}
      />

      <Card className="mb-6 gap-0 overflow-hidden">
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex size-12 items-center justify-center rounded-xl bg-warning/15 text-warning-foreground">
            <Flame className="size-6" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Sequência de registos</p>
            <p className="text-2xl font-semibold tabular-nums">{profile.streak} dias</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className={cn("gap-0 text-center", !a.unlocked && "opacity-60")}>
              <CardContent className="flex flex-col items-center p-5">
                <span
                  className={cn(
                    "flex size-14 items-center justify-center rounded-2xl",
                    a.unlocked
                      ? "bg-primary/12 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon name={a.icon} className="size-7" />
                </span>
                <p className="mt-3 text-sm font-medium">{a.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground text-balance">{a.description}</p>
                {!a.unlocked && a.progress > 0 && (
                  <Progress value={a.progress * 100} className="mt-3 h-1.5" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
