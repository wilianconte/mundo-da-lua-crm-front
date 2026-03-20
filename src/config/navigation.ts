import type { ComponentType } from "react";

import { Banknote, BriefcaseMedical, CalendarDays, LayoutDashboard, Users } from "lucide-react";

export type NavItem = {
  section?: string;
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  showPlus?: boolean;
  badge?: string;
  defaultExpanded?: boolean;
  children?: Array<{
    label: string;
    href: string;
    showPlus?: boolean;
  }>;
};

export const navigationItems: NavItem[] = [
  {
    label: "Dashboards",
    href: "/",
    icon: LayoutDashboard,
    showPlus: true
  },
  {
    section: "Apps",
    label: "Clientes",
    icon: Users,
    children: [
      { label: "Pesquisa", href: "/clientes/pesquisa", showPlus: true },
      { label: "Cadastro", href: "/clientes/cadastro", showPlus: true }
    ]
  },
  {
    section: "Apps",
    label: "Clinica",
    icon: BriefcaseMedical,
    children: [
      { label: "Agenda", href: "/components", showPlus: true },
      { label: "Prontuarios", href: "/components" }
    ]
  },
  {
    section: "Apps",
    label: "Eventos",
    icon: CalendarDays,
    children: [
      { label: "Calendario", href: "/components", showPlus: true },
      { label: "Inscricoes", href: "/components" }
    ]
  },
  {
    section: "Apps",
    label: "Financeiro",
    icon: Banknote,
    children: [
      { label: "Recebimentos", href: "/components", showPlus: true },
      { label: "Cobrancas", href: "/components" }
    ]
  }
];
