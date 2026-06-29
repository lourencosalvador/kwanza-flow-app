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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinancialStore } from "@/store/financial-store";
import type { Priority } from "@/types/domain";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "critica", label: "Crítica" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

export function AddDebtDialog() {
  const [open, setOpen] = React.useState(false);
  const addDebt = useFinancialStore((s) => s.addDebt);

  const [creditor, setCreditor] = React.useState("");
  const [total, setTotal] = React.useState<number>(0);
  const [installments, setInstallments] = React.useState<number>(1);
  const [dueDate, setDueDate] = React.useState(
    new Date().toISOString().slice(0, 10),
  );
  const [priority, setPriority] = React.useState<Priority>("media");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!creditor || total <= 0) return;
    addDebt({ creditor, totalAmount: total, installments, dueDate, priority });
    toast.success("Dívida registada", { description: creditor });
    setCreditor("");
    setTotal(0);
    setInstallments(1);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Nova dívida
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar dívida</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="creditor">Pessoa / Instituição</Label>
            <Input
              id="creditor"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              placeholder="Banco, familiar, amigo…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="total">Valor total</Label>
              <Input
                id="total"
                type="number"
                value={total || ""}
                onChange={(e) => setTotal(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst">Parcelas</Label>
              <Input
                id="inst"
                type="number"
                value={installments || ""}
                onChange={(e) => setInstallments(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="due">Vencimento</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full">
            Registar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
