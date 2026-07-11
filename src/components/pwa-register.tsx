"use client";

import * as React from "react";
import { isPushSupported, registerServiceWorker } from "@/lib/push/client";

/** Regista o service worker (torna a app instalável e pronta para push). */
export function PWARegister() {
  React.useEffect(() => {
    if (!isPushSupported()) return;
    registerServiceWorker().catch(() => {
      /* silencioso — sem SW, a app continua a funcionar sem push */
    });
  }, []);
  return null;
}
