"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSnapshot } from "@/hooks/use-financial-report";
import { buildCashflowSeries } from "@/features/dashboard/lib/series";
import { formatCompact, formatCurrency } from "@/lib/format";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 tabular-nums">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="capitalize text-muted-foreground">{p.dataKey}:</span>
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function CashflowChart() {
  const snapshot = useSnapshot();
  const data = React.useMemo(() => buildCashflowSeries(snapshot, 6), [snapshot]);

  return (
    <Card className="gap-0">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Fluxo de caixa</CardTitle>
        <span className="text-xs text-muted-foreground">Últimos 6 meses</span>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="gReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickFormatter={(v) => formatCompact(v).replace(" Kz", "")}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="receitas"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#gReceitas)"
              />
              <Area
                type="monotone"
                dataKey="despesas"
                stroke="var(--chart-5)"
                strokeWidth={2}
                fill="url(#gDespesas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
