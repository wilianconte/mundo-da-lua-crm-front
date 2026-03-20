import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  ShieldCheck
} from "lucide-react";

import { StatCard } from "@/components/data-display/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

const activityItems = [
  {
    title: "Agenda clinica confirmada",
    detail: "24 atendimentos com confirmacao automatica hoje",
    badge: "Clinica"
  },
  {
    title: "Financeiro conciliado",
    detail: "R$ 18.450 recebidos nas ultimas 24 horas",
    badge: "Financeiro"
  },
  {
    title: "Matriculas em revisao",
    detail: "11 alunos aguardando documentacao complementar",
    badge: "Escola"
  }
];

export function HomeOverview() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-base text-[var(--color-muted-foreground)]">
          Central Hub for Personal Customization
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(15,94,234,0.98),rgba(15,118,110,0.92))] text-white">
          <CardContent className="flex flex-col gap-8 p-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-4">
              <Badge className="bg-white/14 text-white" variant="neutral">
                Operacao centralizada
              </Badge>
              <div className="space-y-3">
                <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
                  Controle escola, clinica e financeiro em um unico cockpit.
                </h2>
                <p className="max-w-xl text-sm text-sky-50/90 md:text-base">
                  Monitore produtividade, gargalos e saude operacional com uma experiencia
                  administrativa consistente e pronta para escalar por tenant.
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-[calc(var(--radius-lg)+6px)] bg-white/12 p-5 backdrop-blur-sm">
              <p className="text-sm text-sky-50/85">Performance semanal</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-semibold">+18%</span>
                <span className="pb-1 text-sm text-sky-50/85">vs. semana anterior</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diretrizes de operacao</CardTitle>
            <CardDescription>
              Resumo rapido para lideranca de atendimento e financeiro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-[var(--color-primary)]" />
                <div>
                  <p className="font-medium">Permissoes em conformidade</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Niveis administrativos sincronizados por tenant.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <div className="flex items-center gap-3">
                <CalendarClock className="size-5 text-[var(--color-secondary)]" />
                <div>
                  <p className="font-medium">Turnos com alta demanda</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Reforce agenda das 14h as 18h para reduzir espera.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="Leads e responsaveis ativos"
          icon={Activity}
          title="Clientes monitorados"
          value="1.284"
        />
        <StatCard
          detail="Agendamentos confirmados hoje"
          icon={CalendarClock}
          title="Agenda do dia"
          value="86"
        />
        <StatCard
          detail="Recebimentos aguardando baixa"
          icon={CreditCard}
          title="Financeiro pendente"
          value="R$ 9.230"
        />
        <StatCard
          detail="Tarefas com SLA dentro da meta"
          icon={ArrowUpRight}
          title="Efetividade"
          value="94%"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Fila operacional</CardTitle>
            <CardDescription>
              Itens que merecem atencao imediata da equipe administrativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityItems.map((item) => (
              <div
                className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 md:flex-row md:items-center md:justify-between"
                key={item.title}
              >
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{item.title}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{item.detail}</p>
                </div>
                <Badge variant="attention">{item.badge}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proximos passos do bootstrap</CardTitle>
            <CardDescription>
              Base pronta para crescer com novos modulos e componentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[var(--color-muted-foreground)]">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
              Definir integracao oficial de autenticacao e sessao por cookie seguro.
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
              Escolher um cliente GraphQL unico entre Apollo Client e urql.
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
              Expandir a secao de componentes com data table, tabs e filtros.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
