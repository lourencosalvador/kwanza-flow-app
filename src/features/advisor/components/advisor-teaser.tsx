"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const QUICK = [
  "Posso comprar isto?",
  "Onde posso economizar?",
  "Quando atinjo a minha meta?",
];

export function AdvisorTeaser() {
  return (
    <Card className="relative overflow-hidden gap-0">
      <div className="absolute -left-6 -top-6 size-28 rounded-full bg-primary/15 blur-2xl" />
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" /> Consultor IA
        </div>
        <p className="mt-2 text-sm text-muted-foreground text-balance">
          O seu consultor conhece todos os seus números. Pergunte qualquer coisa.
        </p>
        <div className="mt-3 space-y-1.5">
          {QUICK.map((q) => (
            <Link
              key={q}
              href="/consultor"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-accent/50"
            >
              <span className="text-muted-foreground">{q}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
