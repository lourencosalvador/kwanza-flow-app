"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/icon";
import { deriveNotifications } from "@/lib/derive";
import { useSnapshot, useMounted } from "@/hooks/use-financial-report";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationLevel } from "@/types/domain";

const LEVEL_ICON: Record<NotificationLevel, string> = {
  info: "Info",
  sucesso: "CheckCircle2",
  aviso: "AlertTriangle",
  perigo: "AlertTriangle",
};

const LEVEL_COLOR: Record<NotificationLevel, string> = {
  info: "text-chart-2",
  sucesso: "text-success",
  aviso: "text-warning-foreground",
  perigo: "text-destructive",
};

export function NotificationsButton() {
  const mounted = useMounted();
  const snapshot = useSnapshot();
  const notifications = React.useMemo(
    () => (mounted ? deriveNotifications(snapshot) : []),
    [mounted, snapshot],
  );
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notificações"
          className="relative"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          {unread > 0 && <Badge variant="default">{unread} novas</Badge>}
        </div>
        {notifications.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Sem notificações por agora. Avisamos quando algo precisar da sua atenção.
          </p>
        )}
        <ul className="max-h-96 overflow-y-auto py-1">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={n.href ?? "#"}
                className={cn(
                  "flex gap-3 px-4 py-3 transition-colors hover:bg-accent/60",
                  !n.read && "bg-accent/30",
                )}
              >
                <Icon
                  name={LEVEL_ICON[n.level]}
                  className={cn("mt-0.5 size-4 shrink-0", LEVEL_COLOR[n.level])}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    {formatDate(n.date)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
