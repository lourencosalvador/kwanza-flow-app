"use client";

import * as React from "react";
import { Wallet } from "lucide-react";
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
import { formatCurrency } from "@/lib/format";
import type { Debt } from "@/types/domain";

const NO_ACCOUNT = "none";

export function PayDebtDialog({ debt }: { debt: Debt }) {
  const [open, setOpen] = React.useState(false);
  const accounts = useFinancialStore((s) => s.snapshot.accounts);
  const payDebt = useFinancialStore((s) => s.payDebt);

  const outstanding = debt.totalAmount - debt.paidAmount;
  const installmentValue =
    debt.installments > 0 ? debt.totalAmount / debt.installments : outstanding;
  const suggested = Math.min(Math.round(installmentValue), outstanding);

  const [amount, setAmount] = React.useState<number>(suggested);
  const [accountId, setAccountId] = React.useState<string>(NO_ACCOUNT);

  // Repõe os valores sempre que o dialog abre.
  React.useEffect(() => {
    if (open) {
      setAmount(suggested);
      setAccountId(NO_ACCOUNT);
    }
  }, [open, suggested]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Math.min(amount, outstanding);
    if (value <= 0) return;
    payDebt(debt.id, value, accountId === NO_ACCOUNT ? undefined : accountId);
    toast.success(
      value >= outstanding ? "Dívida quitada 🎉" : "Pagamento registado",
      { description: `${debt.creditor} · ${formatCurrency(value)}` },
    );
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-1.5">
          <Wallet className="size-4" /> Registrar pagamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar a {debt.creditor}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Em aberto:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(outstanding)}
            </span>
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pay-amount">Valor do pagamento</Label>
              <button
                type="button"
                onClick={() => setAmount(outstanding)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Quitar tudo
              </button>
            </div>
            <Input
              id="pay-amount"
              type="number"
              min={0}
              max={outstanding}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Debitar de uma conta (opcional)</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ACCOUNT}>Não vincular a conta</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} · {formatCurrency(a.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {accountId !== NO_ACCOUNT && (
              <p className="text-xs text-muted-foreground">
                Cria uma despesa e reduz o saldo desta conta.
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={amount <= 0}>
            Confirmar pagamento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
