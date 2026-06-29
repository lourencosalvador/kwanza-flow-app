"use client";

import * as React from "react";
import { analyze } from "@/lib/financial-engine";
import { useFinancialStore } from "@/store/financial-store";

/** Deriva o relatório do Motor Financeiro a partir do snapshot atual. */
export function useFinancialReport() {
  const snapshot = useFinancialStore((s) => s.snapshot);
  return React.useMemo(() => analyze(snapshot), [snapshot]);
}

export function useSnapshot() {
  return useFinancialStore((s) => s.snapshot);
}

/** Evita mismatch de hidratação ao ler estado persistido no cliente. */
export function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}
