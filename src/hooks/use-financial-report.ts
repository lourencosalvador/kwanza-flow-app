"use client";

import * as React from "react";
import { analyze } from "@/lib/financial-engine";
import { useFinancialStore } from "@/store/financial-store";
import { isDemoMode } from "@/lib/env";

/** Deriva o relatório do Motor Financeiro a partir do snapshot atual. */
export function useFinancialReport() {
  const snapshot = useFinancialStore((s) => s.snapshot);
  return React.useMemo(() => analyze(snapshot), [snapshot]);
}

export function useSnapshot() {
  return useFinancialStore((s) => s.snapshot);
}

/**
 * Pronto para renderizar dados:
 * - evita mismatch de hidratação (aguarda mount no cliente);
 * - em modo live, aguarda o primeiro carregamento do Supabase para nunca
 *   mostrar dados que não são do utilizador.
 */
export function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  const serverLoaded = useFinancialStore((s) => s.serverLoaded);
  React.useEffect(() => setMounted(true), []);
  return mounted && (isDemoMode || serverLoaded);
}
