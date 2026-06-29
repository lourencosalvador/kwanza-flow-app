"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/icon";
import { useSnapshot } from "@/hooks/use-financial-report";
import { buildUpcoming } from "@/features/dashboard/lib/series";
import { formatCurrency, formatRelativeDays, formatDate } from "@/lib/format";

export function UpcomingList() {
  const snapshot = useSnapshot();
  const items = React.useMemo(() => buildUpcoming(snapshot), [snapshot]);

  return (
    <Card className="gap-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">A seguir</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon name={item.icon} className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(item.date)} · {formatRelativeDays(item.date)}
              </p>
            </div>
            <span
              className={
                "text-sm font-medium tabular-nums " +
                (item.kind === "salario" ? "text-success" : "text-foreground")
              }
            >
              {item.kind === "salario" ? "+" : "−"}
              {formatCurrency(item.amount).replace("−", "")}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
