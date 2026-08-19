"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinancialStore } from "@/store/financial-store";
import type { CalendarEvent, CalendarEventKind } from "@/types/domain";

const KINDS: { value: CalendarEventKind; label: string }[] = [
  { value: "lembrete", label: "Lembrete" },
  { value: "entrada", label: "Entrada (dinheiro a receber)" },
  { value: "saida", label: "Saída (pagamento)" },
];

export function CalendarEventDialog({
  event,
  defaultDate,
  open,
  onOpenChange,
}: {
  event?: CalendarEvent;
  defaultDate?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!event;
  const addCalendarEvent = useFinancialStore((s) => s.addCalendarEvent);
  const updateCalendarEvent = useFinancialStore((s) => s.updateCalendarEvent);
  const deleteCalendarEvent = useFinancialStore((s) => s.deleteCalendarEvent);

  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState("");
  const [kind, setKind] = React.useState<CalendarEventKind>("lembrete");
  const [amount, setAmount] = React.useState<number>(0);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setDate(event.date);
      setKind(event.kind);
      setAmount(event.amount ?? 0);
      setNote(event.note ?? "");
    } else {
      setTitle("");
      setDate(defaultDate ?? new Date().toISOString().slice(0, 10));
      setKind("lembrete");
      setAmount(0);
      setNote("");
    }
  }, [open, event, defaultDate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const payload = {
      title: title.trim(),
      date,
      kind,
      amount: kind === "lembrete" ? undefined : amount || undefined,
      note: note.trim() || undefined,
    };
    if (isEdit && event) {
      updateCalendarEvent(event.id, payload);
      toast.success("Evento atualizado", { description: title });
    } else {
      addCalendarEvent(payload);
      toast.success("Evento adicionado", { description: title });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar evento" : "Novo evento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Título</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pagar seguro, receber freelance…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-date">Data</Label>
              <Input
                id="ev-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as CalendarEventKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {kind !== "lembrete" && (
            <div className="space-y-1.5">
              <Label htmlFor="ev-amount">Valor (opcional)</Label>
              <Input
                id="ev-amount"
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ev-note">Nota (opcional)</Label>
            <Textarea
              id="ev-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-16"
            />
          </div>

          <div className="flex items-center gap-2">
            {isEdit && event && (
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 text-destructive"
                onClick={() => {
                  deleteCalendarEvent(event.id);
                  toast.success("Evento removido", { description: event.title });
                  onOpenChange(false);
                }}
              >
                <Trash2 className="size-4" /> Remover
              </Button>
            )}
            <Button type="submit" className="flex-1">
              {isEdit ? "Guardar" : "Adicionar evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
