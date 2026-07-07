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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useFinancialStore } from "@/store/financial-store";
import type { Goal } from "@/types/domain";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)", "var(--chart-3)"];

/** Cria (sem `goal`) ou edita (com `goal`) uma meta. */
export function GoalDialog({
  goal,
  open: controlledOpen,
  onOpenChange,
}: {
  goal?: Goal;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = !!goal;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const addGoal = useFinancialStore((s) => s.addGoal);
  const updateGoal = useFinancialStore((s) => s.updateGoal);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [target, setTarget] = React.useState<number>(0);
  const [deadline, setDeadline] = React.useState("");
  const [monthly, setMonthly] = React.useState<number>(0);
  const [color, setColor] = React.useState(COLORS[0]);

  React.useEffect(() => {
    if (!open) return;
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? "");
      setTarget(goal.targetAmount);
      setDeadline(goal.deadline ?? "");
      setMonthly(goal.monthlyContribution ?? 0);
      setColor(goal.color);
    } else {
      setTitle("");
      setDescription("");
      setTarget(0);
      setDeadline("");
      setMonthly(0);
      setColor(COLORS[0]);
    }
  }, [open, goal]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || target <= 0) return;
    const payload = {
      title,
      description: description || undefined,
      targetAmount: target,
      deadline: deadline || undefined,
      monthlyContribution: monthly || undefined,
      color,
    };
    if (isEdit && goal) {
      updateGoal(goal.id, payload);
      toast.success("Meta atualizada", { description: title });
    } else {
      addGoal(payload);
      toast.success("Meta criada", { description: title });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button className="gap-1.5">
            <Plus className="size-4" /> Nova meta
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar meta" : "Criar meta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entrada do carro, viagem…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Descrição (opcional)</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="target">Valor alvo</Label>
              <Input id="target" type="number" value={target || ""} onChange={(e) => setTarget(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthly">Contribuição mensal</Label>
              <Input id="monthly" type="number" value={monthly || ""} onChange={(e) => setMonthly(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Prazo (opcional)</Label>
              <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "size-9 rounded-lg border-2 transition-transform",
                      color === c ? "scale-105 border-foreground" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full">
            {isEdit ? "Guardar alterações" : "Criar meta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
