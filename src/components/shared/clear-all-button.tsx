"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFinancialStore, type ClearableDomain } from "@/store/financial-store";

export function ClearAllButton({
  domain,
  itemsLabel,
  count,
}: {
  domain: ClearableDomain;
  /** Descrição do que será apagado, ex.: "todas as suas metas". */
  itemsLabel: string;
  /** Quantidade atual — desativa o botão quando não há nada para limpar. */
  count: number;
}) {
  const [open, setOpen] = React.useState(false);
  const clearDomain = useFinancialStore((s) => s.clearDomain);

  function confirm() {
    clearDomain(domain);
    toast.success("Tudo limpo", { description: `Removemos ${itemsLabel}.` });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={count === 0}
          className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" /> Limpar tudo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Limpar tudo?</DialogTitle>
          <DialogDescription>
            Esta ação remove {itemsLabel}
            {count > 0 ? ` (${count} ${count === 1 ? "item" : "itens"})` : ""} de
            forma permanente. Não é possível desfazer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirm}>
            Sim, apagar tudo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
