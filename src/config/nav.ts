/** Estrutura de navegação principal do KwanzaFlow. */
export interface NavItem {
  label: string;
  href: string;
  icon: string; // nome do ícone lucide
  group: "Visão" | "Gestão" | "Inteligência";
}

export const NAV: NavItem[] = [
  { label: "Painel", href: "/dashboard", icon: "LayoutDashboard", group: "Visão" },
  { label: "Analytics", href: "/analytics", icon: "BarChart3", group: "Visão" },
  { label: "Timeline", href: "/timeline", icon: "GitCommitVertical", group: "Visão" },

  { label: "Contas", href: "/contas", icon: "Landmark", group: "Gestão" },
  { label: "Salário", href: "/salario", icon: "Banknote", group: "Gestão" },
  { label: "Dívidas", href: "/dividas", icon: "TrendingDown", group: "Gestão" },
  { label: "Metas", href: "/metas", icon: "Target", group: "Gestão" },
  { label: "Planeamento", href: "/planeamento", icon: "ClipboardList", group: "Gestão" },
  { label: "Calendário", href: "/calendario", icon: "CalendarDays", group: "Gestão" },

  { label: "Consultor IA", href: "/consultor", icon: "Sparkles", group: "Inteligência" },
  { label: "Modo Missão", href: "/missoes", icon: "Flag", group: "Inteligência" },
  { label: "Simulador", href: "/simulador", icon: "Calculator", group: "Inteligência" },
  { label: "Conquistas", href: "/conquistas", icon: "Trophy", group: "Inteligência" },
];

export const NAV_GROUPS: NavItem["group"][] = ["Visão", "Gestão", "Inteligência"];
