"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/shared/page-header";
import { ClearAllButton } from "@/components/shared/clear-all-button";
import { EntityMenu } from "@/components/shared/entity-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { AccountDialog } from "@/features/accounts/components/account-dialog";
import { useFinancialStore } from "@/store/financial-store";
import { useMounted } from "@/hooks/use-financial-report";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { BankAccount } from "@/types/domain";

const KIND_LABEL: Record<string, string> = {
  corrente: "Corrente",
  poupanca: "Poupança",
  investimento: "Investimento",
  carteira: "Carteira",
};

export function AccountsView() {
  const mounted = useMounted();
  const accounts = useFinancialStore((s) => s.snapshot.accounts);
  const deleteAccount = useFinancialStore((s) => s.deleteAccount);
  const [editing, setEditing] = React.useState<BankAccount | null>(null);

  if (!mounted) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div>
      <PageHeader
        title="Contas"
        description={`Património distribuído · ${formatCurrency(total)} no total`}
        action={
          <>
            <ClearAllButton
              domain="accounts"
              itemsLabel="todas as contas e transações"
              count={accounts.length}
            />
            <AccountDialog />
          </>
        }
      />

      {accounts.length === 0 && (
        <EmptyState
          icon="Landmark"
          title="Ainda sem contas"
          description="Crie a sua primeira conta bancária para começar a acompanhar o seu património."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a, i) => {
          const pct = a.targetBalance
            ? Math.min(100, Math.round((a.balance / a.targetBalance) * 100))
            : null;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card className="relative overflow-hidden gap-0">
                <div
                  className="absolute -right-6 -top-6 size-24 rounded-full opacity-15 blur-2xl"
                  style={{ backgroundColor: a.color }}
                />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <span
                      className="flex size-11 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: a.color }}
                    >
                      <Icon name={a.icon} className="size-5" />
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">{KIND_LABEL[a.kind]}</Badge>
                      <EntityMenu
                        label={`a conta "${a.name}"`}
                        onEdit={() => setEditing(a)}
                        onDelete={() => {
                          deleteAccount(a.id);
                          toast.success("Conta removida", { description: a.name });
                        }}
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{a.name}</p>
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(a.balance)}
                  </p>

                  {pct !== null && (
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Objetivo</span>
                        <span className="tabular-nums">
                          {pct}% · {formatCurrency(a.targetBalance!)}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {editing && (
        <AccountDialog
          account={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </div>
  );
}
