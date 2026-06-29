"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calculator, Sparkles, CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { useFinancialStore } from "@/store/financial-store";
import { useFinancialReport, useMounted } from "@/hooks/use-financial-report";
import { analyze, simulatePurchase } from "@/lib/financial-engine";
import type { PurchaseSimulationResult } from "@/lib/financial-engine/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const VERDICT = {
  recomendado: { label: "Recomendado", icon: CheckCircle2, cls: "text-success bg-success/12 border-success/30" },
  cautela: { label: "Com cautela", icon: AlertTriangle, cls: "text-warning-foreground bg-warning/15 border-warning/30" },
  evitar: { label: "Evitar", icon: Ban, cls: "text-destructive bg-destructive/12 border-destructive/30" },
} as const;

export function SimulatorView() {
  const mounted = useMounted();
  const snapshot = useFinancialStore((s) => s.snapshot);
  const report = useFinancialReport();

  const [amount, setAmount] = React.useState<number>(250_000);
  const [installments, setInstallments] = React.useState<number>(1);
  const [result, setResult] = React.useState<PurchaseSimulationResult | null>(null);
  const [aiText, setAiText] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  async function run() {
    const r = simulatePurchase({ amount, installments }, report);
    setResult(r);

    // Opinião narrativa do consultor (backend).
    setAiLoading(true);
    setAiText("");
    try {
      const freshReport = analyze(snapshot);
      const question = `Estou a pensar comprar algo por ${amount} Kz${installments > 1 ? ` em ${installments} prestações` : " à vista"}. Faz sentido tendo em conta a minha situação e a minha missão?`;
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          report: freshReport,
          missions: snapshot.missions,
          userName: snapshot.profile.fullName,
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setAiText(acc);
      }
    } finally {
      setAiLoading(false);
    }
  }

  const v = result ? VERDICT[result.verdict] : null;

  return (
    <div>
      <PageHeader
        title="Simulador"
        description="Veja o impacto real de uma compra antes de decidir."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Entrada */}
        <Card className="gap-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="size-4 text-primary" /> Simular compra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="h-12 pr-10 text-lg tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Kz</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst">Prestações</Label>
              <Input
                id="inst"
                type="number"
                min={1}
                value={installments || ""}
                onChange={(e) => setInstallments(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <Button onClick={run} className="w-full gap-1.5">
              <Calculator className="size-4" /> Simular impacto
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <div className="lg:col-span-3">
          {!result ? (
            <Card className="flex h-full items-center justify-center gap-0">
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                Introduza um valor e simule para ver o impacto na sua poupança, metas e fluxo de caixa.
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className={cn("border gap-0", v?.cls)}>
                <CardContent className="flex items-center gap-3 p-4">
                  {v && <v.icon className="size-6" />}
                  <div>
                    <p className="text-sm">Veredito do motor</p>
                    <p className="text-lg font-semibold">{v?.label}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Metric label="Impacto mensal" value={formatCurrency(result.monthlyImpact)} />
                <Metric label="Poupança depois" value={formatCurrency(result.savingsAfter)} />
                <Metric label="Atraso na missão" value={`${result.goalDelayMonths} meses`} />
                <Metric
                  label="Fundo de emergência"
                  value={result.keepsEmergencyFund ? "Mantido" : "Em risco"}
                  danger={!result.keepsEmergencyFund}
                />
              </div>

              <Card className="gap-0">
                <CardContent className="space-y-2 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="size-3.5" /> Opinião do consultor
                  </p>
                  {aiText ? (
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{aiText}</p>
                  ) : (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {result.reasons.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  )}
                  {aiLoading && <p className="text-xs text-muted-foreground">A analisar…</p>}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <Card className="gap-0">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-lg font-semibold tabular-nums", danger && "text-destructive")}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
