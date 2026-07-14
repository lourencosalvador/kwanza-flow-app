"use client";

import * as React from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { BellRing, Loader2, QrCode, Send, Share, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  createDeviceLinkToken,
  savePushSubscription,
  sendTestPush,
} from "@/features/push/actions";
import { env } from "@/lib/env";
import {
  isIOS,
  isPushSupported,
  isStandalone,
  subscribeToPush,
} from "@/lib/push/client";

export function PhoneLinkCard() {
  const [mounted, setMounted] = React.useState(false);
  const [activating, setActivating] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [qr, setQr] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const iosNeedsInstall = mounted && isIOS() && !isStandalone();
  const supported = mounted && isPushSupported();

  async function activateHere() {
    setActivating(true);
    try {
      const platform = isIOS() ? "ios" : /android/i.test(navigator.userAgent) ? "android" : "web";
      const sub = await subscribeToPush(env.vapidPublicKey);
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
        platform,
        userAgent: navigator.userAgent.slice(0, 240),
      });
      if (!res.ok) {
        toast.error("Não foi possível ativar", { description: res.error });
        return;
      }
      toast.success("Notificações ativadas neste telemóvel! 🔔");
    } catch (err) {
      toast.error("Não foi possível ativar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setActivating(false);
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

  async function generateQr() {
    setGenerating(true);
    try {
      const res = await createDeviceLinkToken();
      if (!res.ok) {
        toast.error("Não foi possível gerar o QR", { description: res.error });
        return;
      }
      const dataUrl = await QRCode.toDataURL(res.url, {
        width: 220,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQr(dataUrl);
      toast.success("QR gerado", { description: `Válido por ${res.expiresInMin} min.` });
    } finally {
      setGenerating(false);
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
        {/* iPhone: instruções de instalação primeiro */}
        {iosNeedsInstall ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
            <p className="flex items-center gap-1.5 font-medium">
              <Share className="size-4" /> No iPhone, instala primeiro a app
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs">
              <li>Abre este site no <b>Safari</b>.</li>
              <li>Toca em <b>Partilhar</b> (o quadrado com seta) → <b>Adicionar ao ecrã principal</b>.</li>
              <li>Abre a app pelo <b>ícone</b> no ecrã principal.</li>
              <li>Entra na tua conta e volta a <b>Definições</b> — aqui aparece o botão para ativar.</li>
            </ol>
            <p className="mt-2 text-xs">
              O iOS só permite notificações a apps adicionadas ao ecrã principal.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Ativa as notificações <b>neste telemóvel</b> para receberes avisos de
              salário, dívidas e metas.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={activateHere} disabled={activating || !supported} className="gap-2">
                {activating ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />}
                Ativar notificações
              </Button>
              <Button variant="outline" onClick={test} disabled={testing} className="gap-2">
                {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Enviar teste
              </Button>
            </div>
            {!supported && (
              <p className="mt-2 text-xs text-muted-foreground">
                Este navegador não suporta notificações.
              </p>
            )}
          </>
        )}

        {/* Ligar OUTRO telemóvel via QR (opcional) */}
        <Separator className="my-4" />
        <p className="text-xs font-medium text-muted-foreground">Ligar outro telemóvel</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Gera um código para outra pessoa ligar o telemóvel dela a esta conta.
        </p>
        <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row">
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR para ligar o telemóvel" className="size-36 rounded-lg border border-border bg-white p-1" />
          )}
          <Button variant="outline" onClick={generateQr} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
            {qr ? "Gerar novo QR" : "Gerar QR"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
