"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
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
import { uid } from "@/lib/utils";
import type { Plan, PlanTask } from "@/types/domain";

const PERIODS = ["Mensal", "Trimestral", "Objetivo", "Longo prazo"];

/** Cria (sem `plan`) ou edita (com `plan`) um plano com checklist. */
export function PlanDialog({
  plan,
  open: controlledOpen,
  onOpenChange,
}: {
  plan?: Plan;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = !!plan;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const addPlan = useFinancialStore((s) => s.addPlan);
  const updatePlan = useFinancialStore((s) => s.updatePlan);

  const [title, setTitle] = React.useState("");
  const [period, setPeriod] = React.useState(PERIODS[0]);
  const [budget, setBudget] = React.useState<number>(0);
  const [tasks, setTasks] = React.useState<PlanTask[]>([]);
  const [newTask, setNewTask] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    if (plan) {
      setTitle(plan.title);
      setPeriod(plan.period);
      setBudget(plan.budget);
      setTasks(plan.tasks);
    } else {
      setTitle("");
      setPeriod(PERIODS[0]);
      setBudget(0);
      setTasks([]);
    }
    setNewTask("");
  }, [open, plan]);

  function addTask() {
    const label = newTask.trim();
    if (!label) return;
    setTasks((prev) => [...prev, { id: uid("t"), label, done: false }]);
    setNewTask("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    const payload = { title, period, budget, tasks };
    if (isEdit && plan) {
      updatePlan(plan.id, payload);
      toast.success("Plano atualizado", { description: title });
    } else {
      addPlan(payload);
      toast.success("Plano criado", { description: title });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button className="gap-1.5">
            <Plus className="size-4" /> Novo plano
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar plano" : "Criar plano"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-title">Nome do plano</Label>
            <Input
              id="p-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Plano Dezembro, Plano Viagem…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-budget">Orçamento</Label>
              <Input
                id="p-budget"
                type="number"
                value={budget || ""}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tarefas / checklist</Label>
            <div className="flex gap-2">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Nova tarefa…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTask();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addTask}>
                <Plus className="size-4" />
              </Button>
            </div>
            {tasks.length > 0 && (
              <ul className="mt-2 space-y-1">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-sm"
                  >
                    <span className="truncate">{t.label}</span>
                    <button
                      type="button"
                      onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Remover tarefa ${t.label}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button type="submit" className="w-full">
            {isEdit ? "Guardar alterações" : "Criar plano"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
