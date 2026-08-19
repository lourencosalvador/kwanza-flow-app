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
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { useFinancialStore } from "@/store/financial-store";
import { ACCOUNT_COLORS } from "@/features/accounts/schemas";
import type { SubAccount } from "@/types/domain";

const SUB_ICONS = [
  "Wallet",
  "PartyPopper",
  "UtensilsCrossed",
  "Home",
  "Car",
  "HeartPulse",
  "GraduationCap",
  "Shapes",
];

export function SubAccountDialog({
  accountId,
  sub,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: {
  accountId?: string;
  sub?: SubAccount;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}) {
  const isEdit = !!sub;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const addSubAccount = useFinancialStore((s) => s.addSubAccount);
  const updateSubAccount = useFinancialStore((s) => s.updateSubAccount);

  const [name, setName] = React.useState("");
  const [balance, setBalance] = React.useState<number>(0);
  const [icon, setIcon] = React.useState(SUB_ICONS[0]);
  const [color, setColor] = React.useState(ACCOUNT_COLORS[0]);

  React.useEffect(() => {
    if (!open) return;
    if (sub) {
      setName(sub.name);
      setBalance(sub.balance);
      setIcon(sub.icon);
      setColor(sub.color);
    } else {
      setName("");
      setBalance(0);
      setIcon(SUB_ICONS[0]);
      setColor(ACCOUNT_COLORS[0]);
    }
  }, [open, sub]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit && sub) {
      updateSubAccount(sub.id, { name: name.trim(), balance, icon, color });
      toast.success("Subconta atualizada", { description: name });
    } else if (accountId) {
      addSubAccount({ accountId, name: name.trim(), balance, icon, color });
      toast.success("Subconta criada", { description: name });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="size-3.5" /> Subconta
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar ${sub?.name}` : "Nova subconta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-name">Nome</Label>
              <Input
                id="sub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lazer, Alimentação…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-balance">Valor</Label>
              <Input
                id="sub-balance"
                type="number"
                value={balance || ""}
                onChange={(e) => setBalance(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-1.5">
                {SUB_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border transition-colors",
                      icon === ic
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <Icon name={ic} className="size-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <div className="flex gap-1.5">
                {ACCOUNT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "size-8 rounded-lg border-2 transition-transform",
                      color === c ? "scale-105 border-foreground" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {isEdit ? "Guardar" : "Criar subconta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
