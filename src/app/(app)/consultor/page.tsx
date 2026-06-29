"use client";

import { AdvisorChat } from "@/features/advisor/components/advisor-chat";
import { useMounted } from "@/hooks/use-financial-report";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConsultorPage() {
  const mounted = useMounted();
  if (!mounted) return <Skeleton className="h-[calc(100vh-9.5rem)] w-full rounded-xl" />;
  return <AdvisorChat />;
}
