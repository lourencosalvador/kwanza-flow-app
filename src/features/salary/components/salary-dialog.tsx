"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinancialStore } from "@/store/financial-store";
import type { Salary, SalaryFrequency } from "@/types/domain";

const FREQUENCIES: { value: SalaryFrequency; label: string }[] = [
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "personalizado", label: "Personalizado" },
];

/** Cria (sem `salary`) ou edita (com `salary`) uma fonte de rendimento. */
export function SalaryDialog({
  salary,
  open: controlledOpen,
  onOpenChange,
}: {
  salary?: Salary;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = !!salary;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const accounts = useFinancialStore((s) => s.snapshot.accounts);
  const addSalary = useFinancialStore((s) => s.addSalary);
  const updateSalary = useFinancialStore((s) => s.updateSalary);

  const [label, setLabel] = React.useState("Salário principal");
  const [amount, setAmount] = React.useState<number>(0);
  const [frequency, setFrequency] = React.useState<SalaryFrequency>("mensal");
  const [payDay, setPayDay] = React.useState<number>(1);
  const [accountId, setAccountId] = React.useState<string>("");
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    if (salary) {
      setLabel(salary.label);
      setAmount(salary.amount);
      setFrequency(salary.frequency);
      setPayDay(salary.payDay);
      setAccountId(salary.accountId);
      setActive(salary.active);
    } else {
      setLabel("Salário principal");
      setAmount(0);
      setFrequency("mensal");
      setPayDay(1);
      setAccountId(accounts[0]?.id ?? "");
      setActive(true);
    }
  }, [open, salary, accounts]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label || amount <= 0) return;
    const payload = { label, amount, frequency, payDay, accountId, active };
    if (isEdit && salary) {
      updateSalary(salary.id, payload);
      toast.success("Salário atualizado", { description: label });
    } else {
      addSalary(payload);
      toast.success("Salário criado", { description: label });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-1.5">
            <Plus className="size-4" /> Novo salário
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar salário" : "Novo salário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-label">Descrição</Label>
            <Input id="s-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-amount">Valor líquido</Label>
              <Input
                id="s-amount"
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Frequência</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as SalaryFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-day">Dia do recebimento</Label>
              <Input
                id="s-day"
                type="number"
                min={1}
                max={31}
                value={payDay || ""}
                onChange={(e) => setPayDay(Math.min(31, Math.max(1, Number(e.target.value))))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Conta de destino</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolher conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <span className="text-sm font-medium">Ativo</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </label>
          <Button type="submit" className="w-full">
            {isEdit ? "Guardar alterações" : "Criar salário"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
