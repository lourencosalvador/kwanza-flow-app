"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/env";
import { useFinancialStore } from "@/store/financial-store";

/**
 * Liga o store ao Supabase quando há sessão (modo "live").
 * Em modo demonstração não faz nada — o store mantém o seed local.
 */
export function DataBootstrap() {
  const setLive = useFinancialStore((s) => s.setLive);
  const refresh = useFinancialStore((s) => s.refresh);

  React.useEffect(() => {
    if (isDemoMode) return;
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) {
        setLive(true);
        void refresh();
      } else {
        setLive(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLive(true);
        void refresh();
      } else {
        setLive(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setLive, refresh]);

  return null;
}
