import type { Category, CategoryKey } from "@/types/domain";

/**
 * Categorias predefinidas. Editáveis pelo utilizador (persistidas no Supabase).
 * `essential` distingue despesas fixas/vitais de discricionárias — usado pelo
 * Motor Financeiro para calcular a "taxa de essencialidade" do orçamento.
 */
export const CATEGORIES: Record<CategoryKey, Category> = {
  casa: { key: "casa", label: "Casa", icon: "Home", color: "var(--chart-1)", essential: true },
  renda: { key: "renda", label: "Renda", icon: "KeyRound", color: "var(--chart-2)", essential: true },
  alimentacao: { key: "alimentacao", label: "Alimentação", icon: "UtensilsCrossed", color: "var(--chart-3)", essential: true },
  saude: { key: "saude", label: "Saúde", icon: "HeartPulse", color: "var(--chart-5)", essential: true },
  internet: { key: "internet", label: "Internet", icon: "Wifi", color: "var(--chart-2)", essential: true },
  energia: { key: "energia", label: "Energia", icon: "Zap", color: "var(--chart-3)", essential: true },
  agua: { key: "agua", label: "Água", icon: "Droplets", color: "var(--chart-2)", essential: true },
  empregada: { key: "empregada", label: "Empregada", icon: "Users", color: "var(--chart-4)", essential: true },
  familia: { key: "familia", label: "Família", icon: "HeartHandshake", color: "var(--chart-4)", essential: false },
  lazer: { key: "lazer", label: "Lazer", icon: "PartyPopper", color: "var(--chart-4)", essential: false },
  educacao: { key: "educacao", label: "Educação", icon: "GraduationCap", color: "var(--chart-2)", essential: false },
  investimentos: { key: "investimentos", label: "Investimentos", icon: "TrendingUp", color: "var(--chart-1)", essential: false },
  transporte: { key: "transporte", label: "Transporte", icon: "Car", color: "var(--chart-3)", essential: true },
  outros: { key: "outros", label: "Outros", icon: "Shapes", color: "var(--muted-foreground)", essential: false },
};

export const CATEGORY_LIST: Category[] = Object.values(CATEGORIES);

export function getCategory(key: CategoryKey): Category {
  return CATEGORIES[key] ?? CATEGORIES.outros;
}
