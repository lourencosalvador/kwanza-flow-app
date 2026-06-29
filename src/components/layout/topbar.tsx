"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, Bell, LogOut, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NAV } from "@/config/nav";
import { useUIStore } from "@/store/ui-store";
import { useFinancialStore } from "@/store/financial-store";
import { initials } from "@/lib/utils";
import { NotificationsButton } from "@/features/notifications/components/notifications-button";

function usePageTitle() {
  const pathname = usePathname();
  const match = NAV.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
  );
  return match?.label ?? "KwanzaFlow";
}

export function Topbar() {
  const title = usePageTitle();
  const router = useRouter();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSalaryWizard = useUIStore((s) => s.setSalaryWizard);
  const profile = useFinancialStore((s) => s.snapshot.profile);

  async function signOut() {
    if (isSupabaseConfigured) {
      await createClient().auth.signOut();
    }
    toast.success("Sessão terminada");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-md md:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Menu"
      >
        <Menu className="size-5" />
      </Button>

      <h1 className="text-base font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          onClick={() => setSalaryWizard(true)}
          size="sm"
          className="gap-2 shadow-sm"
        >
          <Banknote className="size-4" />
          <span className="hidden sm:inline">Recebi salário</span>
        </Button>

        <NotificationsButton />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/15 text-primary">
                  {initials(profile.fullName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium text-foreground">
                {profile.fullName}
              </p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/conquistas">
                <Bell className="size-4" /> Conquistas
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Definições</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={signOut}>
              <LogOut className="size-4" /> Terminar sessão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
