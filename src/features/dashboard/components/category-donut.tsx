"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialReport } from "@/hooks/use-financial-report";
import { getCategory } from "@/config/categories";
import { formatCurrency, formatPercent } from "@/lib/format";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

export function CategoryDonut() {
  const report = useFinancialReport();
  const data = React.useMemo(() => {
    const top = report.budget.byCategory.slice(0, 5);
    const rest = report.budget.byCategory.slice(5);
    const restSum = rest.reduce((s, c) => s + c.amount, 0);
    const items = top.map((c) => ({
      name: getCategory(c.category).label,
      value: c.amount,
      share: c.share,
    }));
    if (restSum > 0)
      items.push({
        name: "Restantes",
        value: restSum,
        share: restSum / report.budget.totalExpenses,
      });
    return items;
  }, [report]);

  if (data.length === 0) {
    return (
      <Card className="gap-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Despesas por categoria</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Sem despesas registadas este mês.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Despesas por categoria</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pt-2 sm:flex-row">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={78}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-full space-y-1.5">
          {data.map((d, i) => (
            <li key={`${d.name}-${i}`} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              />
              <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
              <span className="font-medium tabular-nums">{formatPercent(d.share)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
