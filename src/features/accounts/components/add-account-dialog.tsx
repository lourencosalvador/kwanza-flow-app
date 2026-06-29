"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { useFinancialStore } from "@/store/financial-store";
import {
  accountSchema,
  type AccountFormValues,
  ACCOUNT_KIND_LABELS,
  ACCOUNT_ICONS,
  ACCOUNT_COLORS,
} from "@/features/accounts/schemas";

export function AddAccountDialog() {
  const [open, setOpen] = React.useState(false);
  const addAccount = useFinancialStore((s) => s.addAccount);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      kind: "corrente",
      icon: "Landmark",
      color: "var(--chart-1)",
      balance: 0,
    },
  });

  const icon = watch("icon");
  const color = watch("color");
  const kind = watch("kind");

  function onSubmit(values: AccountFormValues) {
    addAccount({
      name: values.name,
      kind: values.kind,
      balance: values.balance,
      currency: "AOA",
      icon: values.icon,
      color: values.color,
      targetBalance: values.targetBalance,
    });
    toast.success("Conta criada", { description: values.name });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Nova conta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conta bancária</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="BAI, BFA, Atlântico…" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={kind} onValueChange={(v) => setValue("kind", v as never)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_KIND_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="balance">Saldo inicial</Label>
              <Input id="balance" type="number" {...register("balance")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="target">Objetivo de saldo (opcional)</Label>
            <Input id="target" type="number" {...register("targetBalance")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ícone</Label>
              <div className="flex gap-1.5">
                {ACCOUNT_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setValue("icon", ic)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg border transition-colors",
                      icon === ic ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
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
                    onClick={() => setValue("color", c)}
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
            Criar conta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
