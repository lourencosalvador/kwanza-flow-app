"use client";

import * as React from "react";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFinancialStore } from "@/store/financial-store";
import { useFinancialReport } from "@/hooks/use-financial-report";
import { formatCurrency } from "@/lib/format";

/**
 * Editor da Estratégia Financeira do utilizador.
 * A capacidade planeada é opcional; vazio = usar a capacidade teórica.
 */
export function StrategyDialog() {
  const [open, setOpen] = React.useState(false);
  const strategy = useFinancialStore((s) => s.snapshot.profile.strategy);
  const updateStrategy = useFinancialStore((s) => s.updateStrategy);
  const report = useFinancialReport();

  const [target, setTarget] = React.useState<string>("");
  const [buffer, setBuffer] = React.useState(true);
  const [optimize, setOptimize] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      setTarget(strategy.monthlySavingsTarget ? String(strategy.monthlySavingsTarget) : "");
      setBuffer(strategy.emergencyBufferEnabled);
      setOptimize(strategy.optimizeForGoal);
    }
  }, [open, strategy]);

  function save() {
    const parsed = target.trim() === "" ? null : Math.max(0, Number(target));
    updateStrategy({
      monthlySavingsTarget: Number.isFinite(parsed as number) ? parsed : null,
      emergencyBufferEnabled: buffer,
      optimizeForGoal: optimize,
    });
    toast.success("Estratégia atualizada", {
      description:
        parsed && parsed > 0
          ? `Poupança planeada: ${formatCurrency(parsed)}/mês`
          : "A usar a capacidade teórica",
    });
    setOpen(false);
  }

  const theoretical = report.cashFlow.theoreticalCapacity;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="size-4" /> Estratégia
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estratégia financeira</DialogTitle>
          <DialogDescription>
            Define quanto queres realmente guardar por mês. Todas as previsões,
            metas e recomendações passam a usar este valor como referência.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="target">Capacidade planeada (poupança/mês)</Label>
            <div className="relative">
              <Input
                id="target"
                type="number"
                inputMode="numeric"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={`Vazio = teórica (${formatCurrency(theoretical)})`}
                className="h-12 pr-10 text-lg tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                Kz
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Capacidade teórica atual: {formatCurrency(theoretical)}. Deixa vazio
              para usar esse máximo.
            </p>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Margem de segurança</p>
              <p className="text-xs text-muted-foreground">
                Reservar a diferença para imprevistos e despesas variáveis
              </p>
            </div>
            <Switch checked={buffer} onCheckedChange={setBuffer} />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Otimizar para a missão</p>
              <p className="text-xs text-muted-foreground">
                A IA prioriza a tua missão principal nas recomendações
              </p>
            </div>
            <Switch checked={optimize} onCheckedChange={setOptimize} />
          </label>

          <Button className="w-full" onClick={save}>
            Guardar estratégia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
