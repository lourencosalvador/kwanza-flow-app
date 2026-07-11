"use client";

import * as React from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { BellRing, Loader2, QrCode, Send, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createDeviceLinkToken, sendTestPush } from "@/features/push/actions";

export function PhoneLinkCard() {
  const [qr, setQr] = React.useState<string | null>(null);
  const [url, setUrl] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [testing, setTesting] = React.useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const res = await createDeviceLinkToken();
      if (!res.ok) {
        toast.error("Não foi possível gerar o QR", { description: res.error });
        return;
      }
      const dataUrl = await QRCode.toDataURL(res.url, {
        width: 240,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQr(dataUrl);
      setUrl(res.url);
      toast.success("QR gerado", {
        description: `Válido por ${res.expiresInMin} minutos.`,
      });
    } finally {
      setGenerating(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const res = await sendTestPush();
      if (!res.ok) {
        toast.error("Não foi possível enviar", { description: res.error });
        return;
      }
      toast.success("Notificação enviada", {
        description: `${res.sent} dispositivo(s). Verifique o telemóvel.`,
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="gap-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="size-4" /> Notificações no telemóvel
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm text-muted-foreground">
          Liga o teu telemóvel para receberes avisos (salário, dívidas, metas)
          nativamente. Gera o código e faz scan com a câmara do telemóvel.
        </p>

        <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
          <div className="flex size-[176px] shrink-0 items-center justify-center rounded-xl border border-border bg-white">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR para ligar o telemóvel" className="size-40" />
            ) : (
              <QrCode className="size-12 text-muted-foreground/40" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <Button onClick={generate} disabled={generating} className="w-full gap-2 sm:w-auto">
              {generating ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
              {qr ? "Gerar novo QR" : "Gerar QR"}
            </Button>

            <Button
              variant="outline"
              onClick={test}
              disabled={testing}
              className="w-full gap-2 sm:w-auto"
            >
              {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar notificação de teste
            </Button>

            <p className="flex items-start gap-1.5 pt-1 text-xs text-muted-foreground">
              <BellRing className="mt-0.5 size-3.5 shrink-0" />
              No iPhone é preciso "Adicionar ao ecrã principal" antes de ativar
              (o iOS só permite notificações a apps instaladas).
            </p>
          </div>
        </div>

        {url && (
          <p className="mt-3 break-all rounded-lg bg-muted px-3 py-2 text-[11px] text-muted-foreground">
            {url}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
