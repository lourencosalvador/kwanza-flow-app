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
import { CATEGORY_LIST } from "@/config/categories";
import { useFinancialStore } from "@/store/financial-store";
import type { CategoryKey, RecurringKind, RecurringPayment } from "@/types/domain";

/** Categoria → tipo de recorrente (para manter a semântica do domínio). */
const CATEGORY_TO_KIND: Partial<Record<CategoryKey, RecurringKind>> = {
  renda: "renda",
  internet: "internet",
  energia: "energia",
  agua: "agua",
  empregada: "empregada",
};

/** Cria (sem `payment`) ou edita (com `payment`) um pagamento recorrente. */
export function RecurringDialog({
  payment,
  open: controlledOpen,
  onOpenChange,
}: {
  payment?: RecurringPayment;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = !!payment;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const addRecurring = useFinancialStore((s) => s.addRecurring);
  const updateRecurring = useFinancialStore((s) => s.updateRecurring);

  const [label, setLabel] = React.useState("");
  const [category, setCategory] = React.useState<CategoryKey>("outros");
  const [amount, setAmount] = React.useState<number>(0);
  const [dayOfMonth, setDayOfMonth] = React.useState<number>(1);
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    if (payment) {
      setLabel(payment.label);
      setCategory(payment.category);
      setAmount(payment.amount);
      setDayOfMonth(payment.dayOfMonth);
      setActive(payment.active);
    } else {
      setLabel("");
      setCategory("outros");
      setAmount(0);
      setDayOfMonth(1);
      setActive(true);
    }
  }, [open, payment]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label || amount <= 0) return;
    const payload = {
      label,
      kind: CATEGORY_TO_KIND[category] ?? ("outros" as RecurringKind),
      category,
      amount,
      dayOfMonth,
      active,
    };
    if (isEdit && payment) {
      updateRecurring(payment.id, payload);
      toast.success("Pagamento atualizado", { description: label });
    } else {
      addRecurring(payload);
      toast.success("Pagamento criado", { description: label });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="size-3.5" /> Adicionar
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Editar ${payment?.label}` : "Novo pagamento recorrente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="r-label">Descrição</Label>
            <Input
              id="r-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Internet, renda, energia…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-amount">Valor mensal</Label>
              <Input
                id="r-amount"
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-day">Dia de vencimento</Label>
              <Input
                id="r-day"
                type="number"
                min={1}
                max={31}
                value={dayOfMonth || ""}
                onChange={(e) =>
                  setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CategoryKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_LIST.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <span className="text-sm font-medium">Ativo</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </label>
          <Button type="submit" className="w-full">
            {isEdit ? "Guardar alterações" : "Criar pagamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
