"use client";

import * as React from "react";
import { BellRing, CheckCircle2, CircleDollarSign, Loader2, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import {
  isIOS,
  isPushSupported,
  isStandalone,
  subscribeToPush,
} from "@/lib/push/client";

type State = "idle" | "linking" | "done" | "error";

export default function LinkDevicePage() {
  const [token, setToken] = React.useState<string | null>(null);
  const [state, setState] = React.useState<State>("idle");
  const [message, setMessage] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("t"));
  }, []);

  const iosNeedsInstall = mounted && isIOS() && !isStandalone();

  async function activate() {
    if (!token) return;
    setState("linking");
    setMessage("");
    try {
      const platform = isIOS() ? "ios" : /android/i.test(navigator.userAgent) ? "android" : "web";
      const sub = await subscribeToPush(env.vapidPublicKey);
      const supabase = createClient();
      const { error } = await supabase.rpc("link_push_device", {
        p_token: token,
        p_endpoint: sub.endpoint,
        p_p256dh: sub.p256dh,
        p_auth: sub.auth,
        p_platform: platform,
        p_user_agent: navigator.userAgent.slice(0, 240),
      });
      if (error) throw new Error(error.message);
      setState("done");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Ocorreu um erro.");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <CircleDollarSign className="size-7" />
        </div>
        <h1 className="mt-4 text-lg font-semibold tracking-tight">
          Ligar telemóvel ao KwanzaFlow
        </h1>

        {!mounted ? null : !token ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Link inválido. Gere um novo QR na app (Definições → Notificações no telemóvel).
          </p>
        ) : !isPushSupported() ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Este navegador não suporta notificações. Abra este link no Chrome (Android)
            ou instale a app no ecrã principal (iOS).
          </p>
        ) : state === "done" ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <CheckCircle2 className="size-10 text-success" />
            <p className="text-sm font-medium">Telemóvel ligado! ✅</p>
            <p className="text-xs text-muted-foreground">
              Vais passar a receber as notificações do KwanzaFlow aqui.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Ativa as notificações para receberes avisos de salário, dívidas e metas
              diretamente neste telemóvel.
            </p>

            {iosNeedsInstall && (
              <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-left text-xs text-warning-foreground">
                <p className="flex items-center gap-1.5 font-medium">
                  <Share className="size-3.5" /> No iPhone, primeiro:
                </p>
                <p className="mt-1">
                  Toca em <b>Partilhar</b> → <b>Adicionar ao ecrã principal</b>, abre a
                  app a partir do ícone e volta a abrir este link. Só assim o iOS permite
                  notificações.
                </p>
              </div>
            )}

            <Button
              className="mt-5 w-full gap-2"
              onClick={activate}
              disabled={state === "linking"}
            >
              {state === "linking" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BellRing className="size-4" />
              )}
              Ativar notificações
            </Button>

            {state === "error" && (
              <p className="mt-3 text-xs text-destructive">{message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
