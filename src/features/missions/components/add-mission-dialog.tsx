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
import type { MissionKind } from "@/types/domain";

const KINDS: { value: MissionKind; label: string }[] = [
  { value: "poupar", label: "Guardar dinheiro" },
  { value: "eliminar_dividas", label: "Eliminar dívidas" },
  { value: "comprar", label: "Comprar algo" },
  { value: "investir", label: "Investir" },
  { value: "negocio", label: "Abrir negócio" },
];

export function AddMissionDialog() {
  const [open, setOpen] = React.useState(false);
  const addMission = useFinancialStore((s) => s.addMission);

  const [title, setTitle] = React.useState("");
  const [kind, setKind] = React.useState<MissionKind>("poupar");
  const [target, setTarget] = React.useState<number>(0);
  const [deadline, setDeadline] = React.useState("");
  const [primary, setPrimary] = React.useState(true);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    addMission({
      title,
      kind,
      targetAmount: target || undefined,
      deadline: deadline || undefined,
      isPrimary: primary,
    });
    toast.success("Missão criada", { description: title });
    setTitle("");
    setTarget(0);
    setDeadline("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Nova missão
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar missão</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Missão</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Guardar 3 milhões, comprar terreno…" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as MissionKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="target">Valor alvo (opcional)</Label>
              <Input id="target" type="number" value={target || ""} onChange={(e) => setTarget(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Prazo (opcional)</Label>
              <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <span className="text-sm font-medium">Definir como missão principal</span>
            <Switch checked={primary} onCheckedChange={setPrimary} />
          </label>
          <Button type="submit" className="w-full">Criar missão</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
