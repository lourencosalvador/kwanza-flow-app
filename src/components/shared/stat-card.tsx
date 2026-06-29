"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  accent = "default",
  index = 0,
}: {
  label: string;
  value: string;
  icon?: string;
  hint?: string;
  trend?: { value: string; positive: boolean };
  accent?: "default" | "primary" | "danger" | "warning";
  index?: number;
}) {
  const accentClasses = {
    default: "text-muted-foreground bg-muted",
    primary: "text-primary bg-primary/12",
    danger: "text-destructive bg-destructive/12",
    warning: "text-warning-foreground bg-warning/15",
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
    >
      <Card className="gap-0 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          {icon && (
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                accentClasses,
              )}
            >
              <Icon name={icon} className="size-4" />
            </span>
          )}
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive",
              )}
            >
              {trend.positive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      </Card>
    </motion.div>
  );
}
