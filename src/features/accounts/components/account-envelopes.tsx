"use client";

import * as React from "react";
import { toast } from "sonner";
import { Icon } from "@/components/icon";
import { EntityMenu } from "@/components/shared/entity-menu";
import { SubAccountDialog } from "@/features/accounts/components/sub-account-dialog";
import { useFinancialStore } from "@/store/financial-store";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BankAccount, SubAccount } from "@/types/domain";

export function AccountEnvelopes({ account }: { account: BankAccount }) {
  const subAccounts = useFinancialStore((s) => s.snapshot.subAccounts);
  const deleteSubAccount = useFinancialStore((s) => s.deleteSubAccount);
  const [editing, setEditing] = React.useState<SubAccount | null>(null);

  const envelopes = subAccounts.filter((x) => x.accountId === account.id);
  const allocated = envelopes.reduce((s, e) => s + e.balance, 0);
  const unallocated = account.balance - allocated;
  const overAllocated = unallocated < 0;

  return (
    <div className="mt-4 border-t border-border/70 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Subcontas</p>
        <SubAccountDialog accountId={account.id} />
      </div>

      {/* Barra de alocação */}
      {account.balance > 0 && (
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted">
          {envelopes.map((e) => (
            <div
              key={e.id}
              style={{
                width: `${Math.min(100, (e.balance / account.balance) * 100)}%`,
                backgroundColor: e.color,
              }}
              title={`${e.name}: ${formatCurrency(e.balance)}`}
            />
          ))}
        </div>
      )}

      {envelopes.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Divide este saldo em bolsos (ex.: Lazer, Alimentação).
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {envelopes.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-accent/50"
            >
              <span
                className="flex size-7 items-center justify-center rounded-md"
                style={{
                  backgroundColor: `color-mix(in oklch, ${e.color} 20%, transparent)`,
                  color: e.color,
                }}
              >
                <Icon name={e.icon} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{e.name}</span>
              <span className="text-sm font-medium tabular-nums">
                {formatCurrency(e.balance)}
              </span>
              <EntityMenu
                label={`a subconta "${e.name}"`}
                onEdit={() => setEditing(e)}
                onDelete={() => {
                  deleteSubAccount(e.id);
                  toast.success("Subconta removida", { description: e.name });
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Não alocado */}
      <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
        <span className="text-muted-foreground">
          {overAllocated ? "Excede o saldo" : "Não alocado"}
        </span>
        <span
          className={cn(
            "font-medium tabular-nums",
            overAllocated ? "text-destructive" : "text-foreground",
          )}
        >
          {formatCurrency(unallocated)}
        </span>
      </div>

      {editing && (
        <SubAccountDialog
          sub={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </div>
  );
}
