"use client";

import { motion } from "framer-motion";
import { GreetingHero } from "@/features/dashboard/components/greeting-hero";
import { SummaryGrid } from "@/features/dashboard/components/summary-grid";
import { CashflowChart } from "@/features/dashboard/components/cashflow-chart";
import { MissionProgress } from "@/features/dashboard/components/mission-progress";
import { UpcomingList } from "@/features/dashboard/components/upcoming-list";
import { CategoryDonut } from "@/features/dashboard/components/category-donut";
import { AdvisorTeaser } from "@/features/advisor/components/advisor-teaser";
import { useMounted } from "@/hooks/use-financial-report";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const mounted = useMounted();
  if (!mounted) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <GreetingHero />
      <SummaryGrid />

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <CashflowChart />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <MissionProgress />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CategoryDonut />
        <UpcomingList />
        <AdvisorTeaser />
      </div>
    </div>
  );
}
