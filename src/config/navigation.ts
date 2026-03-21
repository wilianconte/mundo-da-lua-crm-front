import type { ComponentType } from "react";

import {
  Banknote,
  BarChart3,
  BriefcaseMedical,
  Building2,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Users
} from "lucide-react";

export type NavItem = {
  section?: string;
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  showPlus?: boolean;
  badge?: string;
  defaultExpanded?: boolean;
  children?: NavChildItem[];
};

export type NavChildItem = {
  label: string;
  href?: string;
  showPlus?: boolean;
  children?: NavChildItem[];
};

export const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    showPlus: true
  },
  {
    section: "Base",
    label: "Cadastros",
    icon: Building2,
    children: [
      { label: "Pessoas", href: "/clientes/pesquisa", showPlus: true },
      { label: "Empresas", href: "/components", showPlus: true },
      { label: "Responsaveis", href: "/components", showPlus: true },
      { label: "Alunos / Pacientes", href: "/clientes/cadastro", showPlus: true },
      { label: "Funcionarios", href: "/components", showPlus: true },
      { label: "Fornecedores", href: "/components", showPlus: true }
    ]
  },
  {
    section: "Base",
    label: "CRM / Comercial",
    icon: BarChart3,
    children: [
      { label: "Leads", href: "/components", showPlus: true },
      {
        label: "Funil",
        children: [
          { label: "Funil de Matriculas", href: "/components" },
          { label: "Funil de Consultas", href: "/components" },
          { label: "Funil de Eventos", href: "/components" }
        ]
      },
      { label: "Campanhas", href: "/components", showPlus: true },
      { label: "Origem dos Leads", href: "/components" }
    ]
  },
  {
    section: "Base",
    label: "Atendimento",
    icon: MessageCircle,
    children: [
      { label: "Caixa de Entrada", href: "/components" },
      { label: "WhatsApp", href: "/components" },
      { label: "Instagram", href: "/components" },
      { label: "Facebook", href: "/components" },
      { label: "Conversas", href: "/components", showPlus: true },
      { label: "Modelos de Mensagens", href: "/components", showPlus: true },
      { label: "Historico de Atendimento", href: "/components" }
    ]
  },
  {
    section: "Operacao",
    label: "Contraturno",
    icon: CalendarDays,
    children: [
      { label: "Matriculas", href: "/components", showPlus: true },
      { label: "Turmas", href: "/components", showPlus: true },
      { label: "Frequencia", href: "/components" },
      { label: "Rotina", href: "/components" },
      { label: "Ocorrencias", href: "/components", showPlus: true },
      { label: "Comunicados", href: "/components", showPlus: true }
    ]
  },
  {
    section: "Operacao",
    label: "Clinica",
    icon: BriefcaseMedical,
    children: [
      { label: "Agenda", href: "/components", showPlus: true },
      { label: "Pacientes", href: "/components" },
      { label: "Prontuarios", href: "/components" },
      { label: "Evolucoes", href: "/components" },
      { label: "Profissionais", href: "/components" }
    ]
  },
  {
    section: "Operacao",
    label: "Eventos",
    icon: CalendarDays,
    children: [
      { label: "Calendario", href: "/components", showPlus: true },
      { label: "Eventos", href: "/components", showPlus: true },
      { label: "Inscricoes", href: "/components" },
      { label: "Participantes", href: "/components" },
      { label: "Check-in", href: "/components" }
    ]
  },
  {
    section: "Operacao",
    label: "Financeiro",
    icon: Banknote,
    children: [
      { label: "Recebimentos", href: "/components", showPlus: true },
      { label: "Cobrancas", href: "/components" },
      { label: "Mensalidades", href: "/components" },
      { label: "Contas a Pagar", href: "/components" },
      { label: "Fluxo de Caixa", href: "/components" },
      { label: "Relatorios Financeiros", href: "/components" }
    ]
  },
  {
    section: "Operacao",
    label: "RH",
    icon: Users,
    children: [
      { label: "Funcionarios", href: "/components", showPlus: true },
      { label: "Ponto", href: "/components" },
      { label: "Banco de Horas", href: "/components" },
      { label: "Escalas", href: "/components" },
      { label: "Documentos", href: "/components" }
    ]
  },
  {
    section: "Gestao",
    label: "Agenda Geral",
    icon: CalendarDays,
    children: [
      { label: "Calendario", href: "/components" },
      { label: "Salas", href: "/components" },
      { label: "Reservas", href: "/components" }
    ]
  },
  {
    section: "Gestao",
    label: "Relatorios",
    icon: BarChart3,
    children: [
      { label: "Comercial", href: "/components" },
      { label: "Atendimento", href: "/components" },
      { label: "Contraturno", href: "/components" },
      { label: "Clinica", href: "/components" },
      { label: "Eventos", href: "/components" },
      { label: "Financeiro", href: "/components" },
      { label: "RH", href: "/components" }
    ]
  },
  {
    section: "Gestao",
    label: "Configuracoes",
    icon: Settings,
    children: [
      { label: "Usuarios", href: "/components" },
      { label: "Perfis e Permissoes", href: "/components" },
      { label: "Canais de Atendimento", href: "/components" },
      { label: "Tabelas de Preco", href: "/components" },
      { label: "Unidades / Enderecos", href: "/components" },
      { label: "Modelos de Contrato", href: "/components" },
      { label: "Parametros Gerais", href: "/components" }
    ]
  }
];
