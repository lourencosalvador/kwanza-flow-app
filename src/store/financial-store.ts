"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  BankAccount,
  Debt,
  FinancialSnapshot,
  Goal,
  Mission,
  Plan,
  RecurringPayment,
  Salary,
  Transaction,
  UserStrategy,
} from "@/types/domain";
import type { SalaryAllocationResult } from "@/lib/financial-engine/types";
import { buildEmptySnapshot, buildSeed } from "@/lib/mock/seed";
import { isDemoMode } from "@/lib/env";
import { uid } from "@/lib/utils";
import {
  applySalaryServer,
  clearDomain as clearDomainServer,
  contributeGoal,
  createAccount,
  createDebt,
  createGoal,
  createMission,
  createPlan as createPlanServer,
  createRecurring as createRecurringServer,
  createSalary as createSalaryServer,
  createTransaction,
  deleteAccount as deleteAccountServer,
  deleteDebt as deleteDebtServer,
  deleteGoal as deleteGoalServer,
  deleteMission as deleteMissionServer,
  deletePlan as deletePlanServer,
  deleteRecurring as deleteRecurringServer,
  deleteSalary as deleteSalaryServer,
  fetchSnapshot,
  payDebt as payDebtServer,
  setPrimaryMission as setPrimaryMissionServer,
  updateAccount as updateAccountServer,
  updateDebt as updateDebtServer,
  updateGoal as updateGoalServer,
  updateMission as updateMissionServer,
  updatePlan as updatePlanServer,
  updateProfile as updateProfileServer,
  updateRecurring as updateRecurringServer,
  updateSalary as updateSalaryServer,
  updateStrategy as updateStrategyServer,
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
  /** true depois do primeiro carregamento do servidor (modo live). */
  serverLoaded: boolean;
  setLive: (v: boolean) => void;
  setSnapshot: (s: FinancialSnapshot) => void;
  refresh: () => Promise<void>;

  // Contas
  addAccount: (acc: Omit<BankAccount, "id" | "createdAt">) => void;
  updateAccount: (id: string, patch: Partial<Omit<BankAccount, "id" | "createdAt">>) => void;
  deleteAccount: (id: string) => void;

  // Transações
  addTransaction: (tx: Omit<Transaction, "id">) => void;

  // Salários
  addSalary: (s: Omit<Salary, "id">) => void;
  updateSalary: (id: string, patch: Partial<Omit<Salary, "id">>) => void;
  deleteSalary: (id: string) => void;

  // Recorrentes
  addRecurring: (r: Omit<RecurringPayment, "id">) => void;
  updateRecurring: (id: string, patch: Partial<Omit<RecurringPayment, "id">>) => void;
  deleteRecurring: (id: string) => void;

  // Dívidas
  addDebt: (debt: Omit<Debt, "id" | "paidAmount" | "paidInstallments" | "status" | "history">) => void;
  updateDebt: (id: string, patch: Partial<Omit<Debt, "id" | "history">>) => void;
  deleteDebt: (id: string) => void;
  /** Regista um pagamento (parcial ou total) de uma dívida. Se `accountId` for
   *  passado, debita o valor dessa conta e cria uma transação de despesa. */
  payDebt: (debtId: string, amount: number, accountId?: string) => void;

  // Metas
  addGoal: (goal: Omit<Goal, "id" | "currentAmount" | "status">) => void;
  updateGoal: (id: string, patch: Partial<Omit<Goal, "id">>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number) => void;

  // Missões
  addMission: (mission: Omit<Mission, "id" | "createdAt" | "status">) => void;
  updateMission: (id: string, patch: Partial<Omit<Mission, "id" | "createdAt">>) => void;
  deleteMission: (id: string) => void;
  setPrimaryMission: (missionId: string) => void;

  // Planos
  addPlan: (plan: Omit<Plan, "id" | "createdAt">) => void;
  updatePlan: (id: string, patch: Partial<Omit<Plan, "id" | "createdAt">>) => void;
  deletePlan: (id: string) => void;

  // Perfil (nome, avatar)
  updateProfileLocal: (patch: { fullName?: string; avatarUrl?: string }) => void;

  // Estratégia financeira
  updateStrategy: (patch: Partial<UserStrategy>) => void;

  // Salário (wizard)
  applySalary: (received: number, allocation: SalaryAllocationResult) => void;

  /** Apaga todos os dados de um domínio (por página). Ação destrutiva. */
  clearDomain: (domain: ClearableDomain) => void;
  reset: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Em modo live nada é persistido localmente (a fonte de verdade é o Supabase). */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => {
      /** Dispara escrita no servidor (se live) e reconcilia ids depois. */
      const sync = (op: Promise<unknown>) => {
        if (!get().live) return;
        void op.then(() => get().refresh()).catch(() => {});
      };

      /** Helper imutável por coleção. */
      const patchList = <T extends { id: string }>(
        list: T[],
        id: string,
        patch: Partial<NoInfer<T>>,
      ) => list.map((item) => (item.id === id ? { ...item, ...patch } : item));

      return {
        snapshot: isDemoMode ? buildSeed() : buildEmptySnapshot(),
        hydrated: false,
        live: false,
        serverLoaded: false,

        setLive: (v) => set({ live: v }),
        setSnapshot: (s) => set({ snapshot: s }),
        refresh: async () => {
          if (!get().live) return;
          try {
            const snap = await fetchSnapshot();
            if (snap) set({ snapshot: snap });
          } finally {
            set({ serverLoaded: true });
          }
        },

        // ── Contas ────────────────────────────────────────────
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

        updateAccount: (id, patch) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              accounts: patchList(s.snapshot.accounts, id, patch),
            },
          }));
          sync(updateAccountServer(id, patch));
        },

        deleteAccount: (id) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              accounts: s.snapshot.accounts.filter((a) => a.id !== id),
              // Transações da conta caem junto (espelha o cascade da BD).
              transactions: s.snapshot.transactions.filter((t) => t.accountId !== id),
            },
          }));
          sync(deleteAccountServer(id));
        },

        // ── Transações ────────────────────────────────────────
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

        // ── Salários ──────────────────────────────────────────
        addSalary: (salary) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              salaries: [...s.snapshot.salaries, { ...salary, id: uid("sal") }],
            },
          }));
          sync(createSalaryServer(salary));
        },

        updateSalary: (id, patch) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              salaries: patchList(s.snapshot.salaries, id, patch),
            },
          }));
          sync(updateSalaryServer(id, patch));
        },

        deleteSalary: (id) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              salaries: s.snapshot.salaries.filter((x) => x.id !== id),
            },
          }));
          sync(deleteSalaryServer(id));
        },

        // ── Recorrentes ───────────────────────────────────────
        addRecurring: (r) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              recurring: [...s.snapshot.recurring, { ...r, id: uid("rec") }],
            },
          }));
          sync(createRecurringServer(r));
        },

        updateRecurring: (id, patch) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              recurring: patchList(s.snapshot.recurring, id, patch),
            },
          }));
          sync(updateRecurringServer(id, patch));
        },

        deleteRecurring: (id) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              recurring: s.snapshot.recurring.filter((x) => x.id !== id),
            },
          }));
          sync(deleteRecurringServer(id));
        },

        // ── Dívidas ───────────────────────────────────────────
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

        updateDebt: (id, patch) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              debts: patchList(s.snapshot.debts, id, patch),
            },
          }));
          sync(updateDebtServer(id, patch));
        },

        deleteDebt: (id) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              debts: s.snapshot.debts.filter((x) => x.id !== id),
            },
          }));
          sync(deleteDebtServer(id));
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
                description: `Pagamento a ${target.creditor}`,
                date: today(),
              };
              transactions = [tx, ...transactions];
            }

            return { snapshot: { ...s.snapshot, debts, accounts, transactions } };
          });

          sync(payDebtServer({ debtId, amount, accountId, date: today() }));
        },

        // ── Metas ─────────────────────────────────────────────
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

        updateGoal: (id, patch) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              goals: patchList(s.snapshot.goals, id, patch),
            },
          }));
          sync(updateGoalServer(id, patch));
        },

        deleteGoal: (id) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              goals: s.snapshot.goals.filter((x) => x.id !== id),
            },
          }));
          sync(deleteGoalServer(id));
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

        // ── Missões ───────────────────────────────────────────
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

        updateMission: (id, patch) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              missions: patchList(s.snapshot.missions, id, patch),
            },
          }));
          sync(updateMissionServer(id, patch));
        },

        deleteMission: (id) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              missions: s.snapshot.missions.filter((x) => x.id !== id),
            },
          }));
          sync(deleteMissionServer(id));
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

        // ── Planos ────────────────────────────────────────────
        addPlan: (plan) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              plans: [...s.snapshot.plans, { ...plan, id: uid("plan"), createdAt: today() }],
            },
          }));
          sync(createPlanServer(plan));
        },

        updatePlan: (id, patch) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              plans: patchList(s.snapshot.plans, id, patch),
            },
          }));
          sync(updatePlanServer(id, patch));
        },

        deletePlan: (id) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              plans: s.snapshot.plans.filter((x) => x.id !== id),
            },
          }));
          sync(deletePlanServer(id));
        },

        // ── Perfil ────────────────────────────────────────────
        updateProfileLocal: (patch) => {
          set((s) => ({
            snapshot: {
              ...s.snapshot,
              profile: {
                ...s.snapshot.profile,
                ...(patch.fullName !== undefined ? { fullName: patch.fullName } : {}),
                ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}),
              },
            },
          }));
          sync(updateProfileServer(patch));
        },

        // ── Estratégia financeira ─────────────────────────────
        updateStrategy: (patch) => {
          let next: UserStrategy;
          set((s) => {
            next = { ...s.snapshot.profile.strategy, ...patch };
            return {
              snapshot: {
                ...s.snapshot,
                profile: { ...s.snapshot.profile, strategy: next },
              },
            };
          });
          sync(updateStrategyServer(next!));
        },

        // ── Wizard de salário ─────────────────────────────────
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
                // Transações pertencem a contas; sem contas, ficam órfãs.
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

        reset: () => set({ snapshot: isDemoMode ? buildSeed() : buildEmptySnapshot() }),
      };
    },
    {
      name: "kwanzaflow-demo",
      // v2: snapshot passou a incluir `plans`. Bump invalida caches antigos.
      version: 2,
      // Em modo live, a fonte de verdade é o Supabase: nada fica no localStorage.
      storage: createJSONStorage(() =>
        isDemoMode && typeof window !== "undefined" ? window.localStorage : (noopStorage as never),
      ),
      partialize: (s) => ({ snapshot: s.snapshot }),
      // Garante que um snapshot persistido antigo (sem campos novos como
      // `plans`) nunca deixa arrays undefined — evita crashes ao re-hidratar.
      merge: (persisted, current) => {
        const base = isDemoMode ? buildSeed() : buildEmptySnapshot();
        const snap = (persisted as { snapshot?: Partial<FinancialSnapshot> } | undefined)?.snapshot;
        return {
          ...current,
          snapshot: {
            ...base,
            ...(snap ?? {}),
            // Reafirma que todas as coleções existem, mesmo que o snapshot
            // persistido seja de uma versão anterior.
            accounts: snap?.accounts ?? base.accounts,
            transactions: snap?.transactions ?? base.transactions,
            salaries: snap?.salaries ?? base.salaries,
            debts: snap?.debts ?? base.debts,
            recurring: snap?.recurring ?? base.recurring,
            goals: snap?.goals ?? base.goals,
            missions: snap?.missions ?? base.missions,
            plans: snap?.plans ?? base.plans,
            profile: snap?.profile ?? base.profile,
          },
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
