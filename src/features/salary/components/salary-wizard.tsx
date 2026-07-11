"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  Sparkles,
  TrendingDown,
  PiggyBank,
  Receipt,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUIStore } from "@/store/ui-store";
import { useFinancialStore } from "@/store/financial-store";
import { allocateSalary } from "@/lib/financial-engine";
import type { SalaryAllocationResult } from "@/lib/financial-engine/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Valor recebido", icon: Banknote },
  { id: 2, title: "Dívidas", icon: TrendingDown },
  { id: 3, title: "Pagamentos", icon: Receipt },
  { id: 4, title: "Objetivos", icon: PiggyBank },
  { id: 5, title: "Sugestão", icon: Sparkles },
];

const BUCKET_META: Record<
  SalaryAllocationResult["lines"][number]["bucket"],
  { color: string; label: string }
> = {
  essenciais: { color: "bg-chart-2", label: "Essenciais" },
  dividas: { color: "bg-chart-5", label: "Dívidas" },
  poupanca: { color: "bg-primary", label: "Poupança" },
  objetivos: { color: "bg-chart-4", label: "Objetivos" },
  livre: { color: "bg-chart-3", label: "Livre" },
};

export function SalaryWizard() {
  const open = useUIStore((s) => s.salaryWizardOpen);
  const setOpen = useUIStore((s) => s.setSalaryWizard);

  const snapshot = useFinancialStore((s) => s.snapshot);
  const applySalary = useFinancialStore((s) => s.applySalary);

  const [step, setStep] = React.useState(1);
  const [received, setReceived] = React.useState<number>(
    snapshot.salaries[0]?.amount ?? 0,
  );
  const [selectedDebts, setSelectedDebts] = React.useState<Set<string>>(new Set());
  const [debtAmounts, setDebtAmounts] = React.useState<Record<string, number>>({});
  const [selectedRecurring, setSelectedRecurring] = React.useState<Set<string>>(
    new Set(snapshot.recurring.filter((r) => r.active).map((r) => r.id)),
  );
  // Valor a descontar de cada recorrente NESTE salário (pode diferir do fixo).
  const [recurringAmounts, setRecurringAmounts] = React.useState<Record<string, number>>(
    Object.fromEntries(snapshot.recurring.map((r) => [r.id, r.amount])),
  );
  const [savingsTarget, setSavingsTarget] = React.useState<number>(
    snapshot.goals[0]?.monthlyContribution ?? 100_000,
  );

  // Reinicia ao abrir.
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setReceived(snapshot.salaries[0]?.amount ?? 0);
      const open2 = snapshot.debts.filter((d) => d.status !== "pago");
      setSelectedDebts(new Set(open2.map((d) => d.id)));
      setDebtAmounts(
        Object.fromEntries(
          open2.map((d) => {
            const outstanding = Math.max(0, d.totalAmount - d.paidAmount);
            const suggested =
              d.installments > 1
                ? Math.min(outstanding, Math.round(d.totalAmount / d.installments))
                : outstanding;
            return [d.id, suggested];
          }),
        ),
      );
      setSelectedRecurring(
        new Set(snapshot.recurring.filter((r) => r.active).map((r) => r.id)),
      );
      setRecurringAmounts(
        Object.fromEntries(snapshot.recurring.map((r) => [r.id, r.amount])),
      );
      setSavingsTarget(snapshot.goals[0]?.monthlyContribution ?? 100_000);
    }
  }, [open, snapshot]);

  const openDebts = snapshot.debts.filter((d) => d.status !== "pago");

  const allocation = React.useMemo<SalaryAllocationResult>(() => {
    return allocateSalary({
      received,
      debts: openDebts.map((d) => ({
        id: d.id,
        creditor: d.creditor,
        outstanding: Math.max(0, d.totalAmount - d.paidAmount),
        priority: d.priority,
        // Modo manual: só paga o que o utilizador escolheu (0 se desmarcada).
        payment: selectedDebts.has(d.id) ? Math.max(0, debtAmounts[d.id] ?? 0) : 0,
      })),
      recurring: snapshot.recurring
        .filter((r) => selectedRecurring.has(r.id))
        .map((r) => ({
          id: r.id,
          label: r.label,
          amount: Math.max(0, recurringAmounts[r.id] ?? r.amount),
        })),
      savingsTarget,
    });
  }, [received, openDebts, selectedDebts, debtAmounts, snapshot.recurring, selectedRecurring, recurringAmounts, savingsTarget]);

  const totalDebtsSelected = openDebts
    .filter((d) => selectedDebts.has(d.id))
    .reduce((s, d) => s + Math.max(0, debtAmounts[d.id] ?? 0), 0);

  const totalRecurringSelected = snapshot.recurring
    .filter((r) => selectedRecurring.has(r.id))
    .reduce((s, r) => s + Math.max(0, recurringAmounts[r.id] ?? r.amount), 0);

  function confirm() {
    applySalary(received, allocation);
    toast.success("Salário distribuído!", {
      description: `${formatCurrency(received)} alocados segundo o plano sugerido.`,
    });
    setOpen(false);
  }

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[90dvh] max-w-xl flex-col overflow-hidden" showClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="size-5 text-primary" /> Recebi salário
          </DialogTitle>
          <DialogDescription>
            Vamos distribuir o seu dinheiro de forma inteligente, passo a passo.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between px-1">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border text-xs transition-colors",
                      done && "border-primary bg-primary text-primary-foreground",
                      active && "border-primary bg-primary/15 text-primary",
                      !active && !done && "border-border text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-4" /> : <StepIcon className="size-4" />}
                  </div>
                  <span
                    className={cn(
                      "hidden text-[10px] sm:block",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-1 h-px flex-1 transition-colors",
                      step > s.id ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="min-h-[240px] flex-1 overflow-y-auto py-2 pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <div className="space-y-4">
                  <Label htmlFor="received">Quanto recebeu?</Label>
                  <div className="relative">
                    <Input
                      id="received"
                      type="number"
                      inputMode="numeric"
                      value={received || ""}
                      onChange={(e) => setReceived(Number(e.target.value))}
                      className="h-14 pr-12 text-2xl font-semibold tabular-nums"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      Kz
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[received, 850_000, 500_000, 1_200_000]
                      .filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
                      .map((v) => (
                        <button
                          key={v}
                          onClick={() => setReceived(v)}
                          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                        >
                          {formatCurrency(v)}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Escolha que dívidas pagar com este salário e quanto abater em
                    cada uma.
                  </p>
                  {openDebts.length === 0 && (
                    <p className="rounded-lg bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
                      Sem dívidas em aberto. 🎉
                    </p>
                  )}
                  {openDebts.map((d) => {
                    const on = selectedDebts.has(d.id);
                    const outstanding = Math.max(0, d.totalAmount - d.paidAmount);
                    const val = debtAmounts[d.id] ?? 0;
                    return (
                      <div
                        key={d.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                          on ? "border-border" : "border-border/50 opacity-60",
                        )}
                      >
                        <Switch
                          checked={on}
                          onCheckedChange={(v) =>
                            setSelectedDebts((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(d.id);
                              else next.delete(d.id);
                              return next;
                            })
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate text-sm font-medium">
                            {d.creditor}
                            <Badge
                              variant={
                                d.priority === "critica" || d.priority === "alta"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {d.priority}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            em aberto {formatCurrency(outstanding)}
                          </p>
                        </div>
                        <div className="relative w-28 shrink-0">
                          <Input
                            type="number"
                            inputMode="numeric"
                            disabled={!on}
                            value={on ? (val || "") : ""}
                            onChange={(e) =>
                              setDebtAmounts((prev) => ({
                                ...prev,
                                [d.id]: Math.min(outstanding, Number(e.target.value)),
                              }))
                            }
                            className="h-9 pr-8 text-right text-sm tabular-nums"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            Kz
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {openDebts.length > 0 && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-sm">
                      <span className="font-medium">Total a pagar de dívidas</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(totalDebtsSelected)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Escolha o que descontar deste salário e ajuste o valor de cada um
                    se necessário (não altera a sua configuração fixa).
                  </p>
                  {snapshot.recurring.length === 0 && (
                    <p className="rounded-lg bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
                      Sem pagamentos recorrentes configurados.
                    </p>
                  )}
                  {snapshot.recurring.map((r) => {
                    const on = selectedRecurring.has(r.id);
                    const custom = recurringAmounts[r.id] ?? r.amount;
                    const edited = custom !== r.amount;
                    return (
                      <div
                        key={r.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                          on ? "border-border" : "border-border/50 opacity-60",
                        )}
                      >
                        <Switch
                          checked={on}
                          onCheckedChange={(v) =>
                            setSelectedRecurring((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(r.id);
                              else next.delete(r.id);
                              return next;
                            })
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.label}</p>
                          <p className="text-xs text-muted-foreground">
                            fixo {formatCurrency(r.amount)} · dia {r.dayOfMonth}
                            {edited && on && (
                              <span className="ml-1 text-primary">· ajustado</span>
                            )}
                          </p>
                        </div>
                        <div className="relative w-28 shrink-0">
                          <Input
                            type="number"
                            inputMode="numeric"
                            disabled={!on}
                            value={on ? (custom || "") : ""}
                            onChange={(e) =>
                              setRecurringAmounts((prev) => ({
                                ...prev,
                                [r.id]: Number(e.target.value),
                              }))
                            }
                            className="h-9 pr-8 text-right text-sm tabular-nums"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            Kz
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {snapshot.recurring.length > 0 && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-sm">
                      <span className="font-medium">Total a descontar</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(totalRecurringSelected)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <Label htmlFor="savings">Quanto pretende guardar?</Label>
                  <div className="relative">
                    <Input
                      id="savings"
                      type="number"
                      inputMode="numeric"
                      value={savingsTarget || ""}
                      onChange={(e) => setSavingsTarget(Number(e.target.value))}
                      className="h-14 pr-12 text-2xl font-semibold tabular-nums"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      Kz
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recomendado: pelo menos 20% do salário ={" "}
                    {formatCurrency(Math.round(received * 0.2))}.
                  </p>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  {/* Barra de distribuição */}
                  <div className="flex h-3 overflow-hidden rounded-full">
                    {allocation.lines.map((l, i) => (
                      <div
                        key={i}
                        className={cn(BUCKET_META[l.bucket].color)}
                        style={{ width: `${Math.max(2, l.share * 100)}%` }}
                        title={`${l.label}: ${formatCurrency(l.amount)}`}
                      />
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    {allocation.lines.map((l, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2.5 rounded-full",
                              BUCKET_META[l.bucket].color,
                            )}
                          />
                          {l.label}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(l.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Explicação da IA (a partir do motor) */}
                  <div className="rounded-lg border border-primary/20 bg-primary/[0.06] p-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="size-3.5" /> O consultor explica
                    </p>
                    <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                      {allocation.rationale.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 1}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Button>
          {step < 5 ? (
            <Button
              onClick={next}
              disabled={step === 1 && received <= 0}
              className="gap-1.5"
            >
              Continuar <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={confirm} className="gap-1.5">
              <Check className="size-4" /> Aplicar distribuição
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
