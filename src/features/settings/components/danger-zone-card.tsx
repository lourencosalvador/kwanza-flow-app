"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFinancialStore } from "@/store/financial-store";

export function DangerZoneCard() {
  const wipeAll = useFinancialStore((s) => s.wipeAll);
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [working, setWorking] = React.useState(false);

  const canWipe = confirmText.trim().toUpperCase() === "APAGAR";

  async function doWipe() {
    if (!canWipe) return;
    setWorking(true);
    wipeAll();
    // dá tempo à sincronização otimista/servidor
    setTimeout(() => {
      toast.success("Conta reposta", {
        description: "Todos os dados financeiros foram apagados.",
      });
      setWorking(false);
      setConfirmText("");
      setOpen(false);
    }, 400);
  }

  return (
    <Card className="gap-0 border-destructive/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          <AlertTriangle className="size-4" /> Zona de perigo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm text-muted-foreground">
          Apaga <b>todos</b> os teus dados financeiros (contas, salário,
          pagamentos recorrentes, dívidas, metas, missões, planos, subcontas e
          eventos do calendário) e recomeça do zero. O teu perfil e a sessão
          mantêm-se. Esta ação não pode ser desfeita.
        </p>
        <Button
          variant="outline"
          className="mt-3 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="size-4" /> Apagar todos os dados
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apagar todos os dados?</DialogTitle>
            <DialogDescription>
              Isto remove permanentemente todos os teus dados financeiros. Para
              confirmar, escreve <b>APAGAR</b> em baixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="wipe-confirm">Confirmação</Label>
              <Input
                id="wipe-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="APAGAR"
                autoComplete="off"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={!canWipe || working} onClick={doWipe}>
                {working && <Loader2 className="size-4 animate-spin" />}
                Apagar tudo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
