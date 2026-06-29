"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CashflowChart } from "@/features/dashboard/components/cashflow-chart";
import { CategoryDonut } from "@/features/dashboard/components/category-donut";
import { useFinancialReport, useMounted } from "@/hooks/use-financial-report";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsView() {
  const mounted = useMounted();
  const report = useFinancialReport();

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  const forecastData = report.forecast.points.map((p) => ({
    month: p.month.slice(5),
    Património: p.netWorth,
    Poupança: p.savings,
  }));

  const fw = report.budget.framework;
  const frameworkData = [
    { name: "Necessidades", real: fw.needsActual, alvo: fw.needsTarget },
    { name: "Desejos", real: fw.wantsActual, alvo: fw.wantsTarget },
    { name: "Poupança", real: fw.savingsActual, alvo: fw.savingsTarget },
  ];

  return (
    <div>
      <PageHeader title="Analytics" description="Visão analítica da sua vida financeira." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Taxa de poupança" value={formatPercent(report.cashFlow.savingsRate)} icon="PiggyBank" accent="primary" index={0} />
        <StatCard label="Essenciais" value={formatPercent(report.budget.essentialShare)} icon="Home" index={1} />
        <StatCard label="Rácio dívida" value={formatPercent(report.netWorth.debtRatio)} icon="TrendingDown" accent={report.netWorth.debtRatio > 0.4 ? "danger" : "default"} index={2} />
        <StatCard label="Património (6m)" value={formatCompact(report.forecast.projectedNetWorth)} icon="TrendingUp" accent="primary" index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Previsão de património</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gNW" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => formatCompact(v).replace(" Kz", "")} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="Património" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gNW)" />
                  <Area type="monotone" dataKey="Poupança" stroke="var(--chart-2)" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Orçamento 50 / 30 / 20</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frameworkData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => formatCompact(v).replace(" Kz", "")} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="real" name="Real" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="alvo" name="Alvo" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} opacity={0.4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <CashflowChart />
        <CategoryDonut />
      </div>
    </div>
  );
}
