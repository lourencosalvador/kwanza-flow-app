import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(2, "Nome demasiado curto").max(40),
  kind: z.enum(["corrente", "poupanca", "investimento", "carteira"]),
  balance: z.coerce.number().min(0, "Não pode ser negativo"),
  icon: z.string().default("Landmark"),
  color: z.string().default("var(--chart-1)"),
  targetBalance: z.coerce.number().min(0).optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

export const ACCOUNT_KIND_LABELS: Record<AccountFormValues["kind"], string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  investimento: "Investimento",
  carteira: "Carteira / dinheiro",
};

export const ACCOUNT_ICONS = ["Landmark", "PiggyBank", "Wallet", "TrendingUp", "CircleDollarSign"];
export const ACCOUNT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
