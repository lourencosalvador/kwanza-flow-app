"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BankAccount,
  Debt,
  FinancialSnapshot,
  Goal,
  Mission,
  Transaction,
} from "@/types/domain";
import type { SalaryAllocationResult } from "@/lib/financial-engine/types";
import { buildSeed } from "@/lib/mock/seed";
import { uid } from "@/lib/utils";
import {
  applySalaryServer,
  clearDomain as clearDomainServer,
  contributeGoal,
  createAccount,
  createDebt,
  createGoal,
  createMission,
  createTransaction,
  fetchSnapshot,
  payDebt as payDebtServer,
  setPrimaryMission as setPrimaryMissionServer,
} from "@/features/shared/actions";

/** Domínios que suportam "Limpar tudo" por página. */
export type ClearableDomain =
  | "accounts"
  | "salaries"
  | "debts"
  | "goals"
  | "missions";

interface FinancialState {
  snapshot: FinancialSnapshot;
  hydrated: boolean;
  /** true quando ligado ao Supabase (utilizador autenticado). */
  live: boolean;
  setLive: (v: boolean) => void;
  setSnapshot: (s: FinancialSnapshot) => void;
  refresh: () => Promise<void>;
  // ações
  addAccount: (acc: Omit<BankAccount, "id" | "createdAt">) => void;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  addDebt: (debt: Omit<Debt, "id" | "paidAmount" | "paidInstallments" | "status" | "history">) => void;
  /** Regista um pagamento (parcial ou total) de uma dívida. Se `accountId` for
   *  passado, debita o valor dessa conta e cria uma transação de despesa. */
  payDebt: (debtId: string, amount: number, accountId?: string) => void;
  addGoal: (goal: Omit<Goal, "id" | "currentAmount" | "status">) => void;
  contributeToGoal: (goalId: string, amount: number) => void;
  addMission: (mission: Omit<Mission, "id" | "createdAt" | "status">) => void;
  setPrimaryMission: (missionId: string) => void;
  applySalary: (received: number, allocation: SalaryAllocationResult) => void;
  /** Apaga todos os dados de um domínio (por página). Ação destrutiva. */
  clearDomain: (domain: ClearableDomain) => void;
  reset: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => {
      /** Dispara escrita no servidor (se live) e reconcilia ids depois. */
      const sync = (op: Promise<unknown>) => {
        if (!get().live) return;
        void op.then(() => get().refresh()).catch(() => {});
      };

      return {
        snapshot: buildSeed(),
        hydrated: false,
        live: false,

        setLive: (v) => set({ live: v }),
        setSnapshot: (s) => set({ snapshot: s }),
        refresh: async () => {
          if (!get().live) return;
          const snap = await fetchSnapshot();
          if (snap) set({ snapshot: snap });
        },

        addAccount: (acc) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              accounts: [
                ...s.snapshot.accounts,
                { ...acc, id: uid("acc"), createdAt: today() },
              ],
            },
          }));
          sync(createAccount(acc));
        },

        addTransaction: (tx) => {
          set((s) => {
            const transaction: Transaction = { ...tx, id: uid("tx") };
            const accounts = s.snapshot.accounts.map((a) => {
              if (a.id !== tx.accountId) return a;
              const delta = tx.type === "receita" ? tx.amount : -tx.amount;
              return { ...a, balance: a.balance + delta };
            });
            return {
              snapshot: {
                ...s.snapshot,
                transactions: [transaction, ...s.snapshot.transactions],
                accounts,
              },
            };
          });
          sync(createTransaction(tx));
        },

        addDebt: (debt) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              debts: [
                ...s.snapshot.debts,
                {
                  ...debt,
                  id: uid("debt"),
                  paidAmount: 0,
                  paidInstallments: 0,
                  status: "pendente",
                  history: [],
                },
              ],
            },
          }));
          sync(createDebt(debt));
        },

        payDebt: (debtId, amount, accountId) => {
          if (amount <= 0) return;
          set((s) => {
            const target = s.snapshot.debts.find((d) => d.id === debtId);
            if (!target) return s;

            // Nunca abate mais do que o valor em aberto.
            const outstanding = target.totalAmount - target.paidAmount;
            const applied = Math.min(amount, outstanding);
            if (applied <= 0) return s;

            const debts = s.snapshot.debts.map((d) => {
              if (d.id !== debtId) return d;
              const paidAmount = d.paidAmount + applied;
              const installmentValue =
                d.installments > 0 ? d.totalAmount / d.installments : d.totalAmount;
              const paidInstallments =
                paidAmount >= d.totalAmount
                  ? d.installments
                  : Math.min(d.installments, Math.round(paidAmount / installmentValue));
              return {
                ...d,
                paidAmount,
                paidInstallments,
                status:
                  paidAmount >= d.totalAmount ? ("pago" as const) : ("parcial" as const),
                history: [...(d.history ?? []), { date: today(), amount: applied }],
              };
            });

            let accounts = s.snapshot.accounts;
            let transactions = s.snapshot.transactions;
            if (accountId) {
              accounts = accounts.map((a) =>
                a.id === accountId ? { ...a, balance: a.balance - applied } : a,
              );
              const tx: Transaction = {
                id: uid("tx"),
                accountId,
                type: "despesa",
                amount: applied,
                category: "outros",
                description: `Pagamento — ${target.creditor}`,
                date: today(),
              };
              transactions = [tx, ...transactions];
            }

            return { snapshot: { ...s.snapshot, debts, accounts, transactions } };
          });

          sync(payDebtServer({ debtId, amount, accountId, date: today() }));
        },

        addGoal: (goal) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              goals: [
                ...s.snapshot.goals,
                { ...goal, id: uid("goal"), currentAmount: 0, status: "ativa" },
              ],
            },
          }));
          sync(createGoal(goal));
        },

        contributeToGoal: (goalId, amount) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              goals: s.snapshot.goals.map((g) =>
                g.id === goalId
                  ? {
                      ...g,
                      currentAmount: Math.min(g.targetAmount, g.currentAmount + amount),
                      status:
                        g.currentAmount + amount >= g.targetAmount ? "concluida" : g.status,
                    }
                  : g,
              ),
            },
          }));
          sync(contributeGoal(goalId, amount));
        },

        addMission: (mission) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              missions: [
                ...s.snapshot.missions.map((m) =>
                  mission.isPrimary ? { ...m, isPrimary: false } : m,
                ),
                { ...mission, id: uid("mission"), createdAt: today(), status: "ativa" },
              ],
            },
          }));
          sync(createMission(mission));
        },

        setPrimaryMission: (missionId) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              missions: s.snapshot.missions.map((m) => ({
                ...m,
                isPrimary: m.id === missionId,
              })),
            },
          }));
          sync(setPrimaryMissionServer(missionId));
        },

        applySalary: (received, allocation) => {
          const state = get();
          const primaryAccount =
            state.snapshot.salaries[0]?.accountId ?? state.snapshot.accounts[0]?.id;
          const savingsAccount =
            state.snapshot.accounts.find((a) => a.kind === "poupanca")?.id ?? primaryAccount;

          set((s) => {
            let accounts = s.snapshot.accounts.map((a) =>
              a.id === primaryAccount ? { ...a, balance: a.balance + received } : a,
            );
            if (allocation.totalSavings > 0 && savingsAccount !== primaryAccount) {
              accounts = accounts.map((a) => {
                if (a.id === primaryAccount)
                  return { ...a, balance: a.balance - allocation.totalSavings };
                if (a.id === savingsAccount)
                  return { ...a, balance: a.balance + allocation.totalSavings };
                return a;
              });
            }

            const debtLines = allocation.lines.filter((l) => l.bucket === "dividas");
            const debts = s.snapshot.debts.map((d) => {
              const line = debtLines.find((l) => l.label.includes(d.creditor));
              if (!line) return d;
              const paidAmount = Math.min(d.totalAmount, d.paidAmount + line.amount);
              return {
                ...d,
                paidAmount,
                status:
                  paidAmount >= d.totalAmount ? ("pago" as const) : ("parcial" as const),
                history: [...(d.history ?? []), { date: today(), amount: line.amount }],
              };
            });

            const tx: Transaction = {
              id: uid("tx"),
              accountId: primaryAccount,
              type: "receita",
              amount: received,
              category: "outros",
              description: "Salário recebido",
              date: today(),
              recurring: true,
            };

            return {
              snapshot: {
                ...s.snapshot,
                accounts,
                debts,
                transactions: [tx, ...s.snapshot.transactions],
              },
            };
          });

          // Persistência no servidor.
          const debtPayments = allocation.lines
            .filter((l) => l.bucket === "dividas")
            .map((l) => {
              const debt = state.snapshot.debts.find((d) => l.label.includes(d.creditor));
              return debt ? { id: debt.id, amount: l.amount } : null;
            })
            .filter((x): x is { id: string; amount: number } => x !== null);

          sync(
            applySalaryServer({
              received,
              savings: allocation.totalSavings,
              primaryAccountId: primaryAccount,
              savingsAccountId: savingsAccount,
              debtPayments,
              date: today(),
            }),
          );
        },

        clearDomain: (domain) => {
          set((s) => {
            const snapshot = { ...s.snapshot };
            switch (domain) {
              case "accounts":
                // Transações pertencem a contas — sem contas, ficam órfãs.
                snapshot.accounts = [];
                snapshot.transactions = [];
                break;
              case "salaries":
                snapshot.salaries = [];
                break;
              case "debts":
                snapshot.debts = [];
                break;
              case "goals":
                snapshot.goals = [];
                break;
              case "missions":
                snapshot.missions = [];
                break;
            }
            return { snapshot };
          });
          sync(clearDomainServer(domain));
        },

        reset: () => set({ snapshot: buildSeed() }),
      };
    },
    {
      name: "kwanzaflow-demo",
      partialize: (s) => ({ snapshot: s.snapshot }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
