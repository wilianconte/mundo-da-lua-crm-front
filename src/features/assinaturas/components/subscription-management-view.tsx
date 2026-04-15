"use client";

import { AlertCircle, Check, CreditCard, Loader2, ShieldAlert, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import {
  cancelTenantPlan,
  getMyActivePlan,
  getMyBillings,
  getMyTenant,
  getPlans,
  mapSubscriptionApiError,
  markBillingAsPaid,
  revertCancellation,
  startTrial,
  terminateTrial,
  upgradeTenantPlan,
  type ActiveTenantPlan,
  type BillingStatus,
  type BillingsConnection,
  type GetMyBillingsVariables,
  type MyTenant,
  type SubscriptionPlan,
  type SubscriptionPlanFeature
} from "@/features/assinaturas/api/subscription-management";
import { hasPermission, SYSTEM_PERMISSIONS } from "@/lib/auth/permissions";
import { getAuthUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

type SubscriptionSection = "plans" | "billings";
type DialogActionKind = "upgrade" | "trial" | "cancel" | "terminateTrial" | "revert" | "payBilling";
type PlanDetailsState = {
  plan: SubscriptionPlan;
};

type ActionDialogState = {
  kind: DialogActionKind;
  title: string;
  description: string;
  confirmLabel: string;
  targetPlanId?: string;
  targetBillingId?: string;
  requiresPlanSelection?: boolean;
  planOptions?: SubscriptionPlan[];
};

function toDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: string | null) {
  const date = toDate(value);
  return date ? date.toLocaleDateString("pt-BR") : "-";
}

function formatCurrency(value: string | number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function getDaysRemaining(endDate?: string | null) {
  const parsedEndDate = toDate(endDate);
  if (!parsedEndDate) return null;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((parsedEndDate.getTime() - startOfToday.getTime()) / 86_400_000);
}

function formatFeatureValue(feature: SubscriptionPlanFeature) {
  if (feature.feature.type === "BOOLEAN") {
    return feature.value === 0 ? "Nao" : "Sim";
  }

  return feature.value == null ? "Ilimitado" : String(feature.value);
}

function toPlanStatusLabel(activePlan: ActiveTenantPlan) {
  if (activePlan.isTrial) return "Trial";
  if (activePlan.status === "PENDING_CANCELLATION") return "Cancelamento agendado";
  return "Ativo";
}

function toTenantStatusMessage(tenant: MyTenant | null, activePlan: ActiveTenantPlan | null) {
  if (!tenant || !activePlan) return null;

  if (tenant.status === "SUSPENDED") {
    return "Existe uma cobranca vencida vinculada a este tenant. Regularize o pagamento para liberar o acesso.";
  }

  if (activePlan.status === "PENDING_CANCELLATION") {
    return `O plano segue ativo ate ${formatDate(activePlan.endDate)} e depois migra para ${activePlan.fallbackPlan?.displayName ?? "o plano de destino"}.`;
  }

  if (activePlan.isTrial) {
    const remainingDays = getDaysRemaining(activePlan.endDate);
    return remainingDays == null
      ? "O tenant esta em trial."
      : `O trial termina em ${remainingDays} dia(s). Ao encerrar, o tenant segue para ${activePlan.fallbackPlan?.displayName ?? "o plano configurado"}.`;
  }

  if (Number(activePlan.plan.price) === 0) {
    return "O tenant esta no plano gratuito e pode contratar um plano pago a qualquer momento.";
  }

  return `O ciclo atual segue ate ${formatDate(activePlan.endDate)}. Qualquer upgrade proporcional sera calculado pelo backend.`;
}

function toBillingVariant(status: BillingStatus): "success" | "attention" | "neutral" {
  if (status === "PAID") return "success";
  if (status === "PENDING" || status === "OVERDUE") return "attention";
  return "neutral";
}

function toBillingLabel(status: BillingStatus) {
  if (status === "PENDING") return "Pendente";
  if (status === "PAID") return "Pago";
  if (status === "OVERDUE") return "Vencida";
  if (status === "REFUNDED") return "Reembolsada";
  return "Cancelada";
}

export function SubscriptionManagementView({ section }: { section: SubscriptionSection }) {
  const router = useRouter();
  const authUser = getAuthUser();
  const canManagePlans = Boolean(authUser?.isAdmin || hasPermission(authUser?.permissions ?? [], SYSTEM_PERMISSIONS.plansManage));
  const [activePlan, setActivePlan] = useState<ActiveTenantPlan | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [tenant, setTenant] = useState<MyTenant | null>(null);
  const [billingsConnection, setBillingsConnection] = useState<BillingsConnection | null>(null);
  const [isLoadingBase, setIsLoadingBase] = useState(true);
  const [isLoadingBillings, setIsLoadingBillings] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetailsState | null>(null);
  const [selectedTargetPlanId, setSelectedTargetPlanId] = useState("");
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadBase() {
      try {
        setIsLoadingBase(true);
        const [nextActivePlan, nextPlans, nextTenant] = await Promise.all([getMyActivePlan(), getPlans(), getMyTenant()]);

        if (!isMounted) return;

        setActivePlan(nextActivePlan);
        setPlans(nextPlans);
        setTenant(nextTenant);
      } catch (error) {
        if (!isMounted) return;
        setFeedback({ tone: "error", message: mapSubscriptionApiError(error) });
      } finally {
        if (isMounted) setIsLoadingBase(false);
      }
    }

    void loadBase();

    return () => {
      isMounted = false;
    };
  }, [reloadCounter]);

  useEffect(() => {
    if (!canManagePlans || (section !== "billings" && tenant?.status !== "SUSPENDED")) {
      return;
    }

    let isMounted = true;

    async function loadBillings() {
      try {
        setIsLoadingBillings(true);
        const response = await getMyBillings({
          first: 10,
          order: [{ dueDate: "DESC" as const }]
        });

        if (!isMounted) return;
        setBillingsConnection(response);
      } catch (error) {
        if (!isMounted) return;
        setFeedback({ tone: "error", message: mapSubscriptionApiError(error) });
      } finally {
        if (isMounted) setIsLoadingBillings(false);
      }
    }

    void loadBillings();

    return () => {
      isMounted = false;
    };
  }, [canManagePlans, section, tenant?.status, reloadCounter]);

  useEffect(() => {
    if (tenant?.status === "SUSPENDED" && section !== "billings" && canManagePlans) {
      router.replace("/minha-assinatura/faturas");
    }
  }, [canManagePlans, router, section, tenant?.status]);

  const outstandingBilling = useMemo(() => {
    return billingsConnection?.nodes.find((billing) => billing.status === "OVERDUE" || billing.status === "PENDING") ?? null;
  }, [billingsConnection]);
  const availableTerminateTargets = useMemo(() => {
    if (!activePlan) return [];
    return plans.filter((plan) => plan.id !== activePlan.plan.id);
  }, [activePlan, plans]);
  const availableDowngradeTargets = useMemo(() => {
    if (!activePlan) return [];
    return plans.filter((plan) => plan.id !== activePlan.plan.id && plan.sortOrder <= activePlan.plan.sortOrder);
  }, [activePlan, plans]);

  function openDialog(nextDialog: ActionDialogState) {
    setSelectedTargetPlanId(nextDialog.targetPlanId ?? nextDialog.planOptions?.[0]?.id ?? "");
    setDialog(nextDialog);
  }

  function refreshAll() {
    setReloadCounter((current) => current + 1);
  }

  async function confirmDialog() {
    if (!dialog) return;

    try {
      setIsMutating(true);
      setFeedback(null);

      if (dialog.kind === "upgrade") await upgradeTenantPlan(dialog.targetPlanId ?? selectedTargetPlanId);
      if (dialog.kind === "trial") await startTrial(dialog.targetPlanId ?? selectedTargetPlanId);
      if (dialog.kind === "cancel") await cancelTenantPlan(selectedTargetPlanId);
      if (dialog.kind === "terminateTrial") await terminateTrial(dialog.requiresPlanSelection ? selectedTargetPlanId : undefined);
      if (dialog.kind === "revert") await revertCancellation();
      if (dialog.kind === "payBilling") await markBillingAsPaid(dialog.targetBillingId ?? "");

      setDialog(null);
      setFeedback({ tone: "success", message: "Operacao concluida com sucesso." });
      refreshAll();
    } catch (error) {
      setFeedback({ tone: "error", message: mapSubscriptionApiError(error) });
    } finally {
      setIsMutating(false);
    }
  }

  function renderSummaryActions() {
    if (!activePlan) return null;

    if (tenant?.status === "SUSPENDED" && canManagePlans) {
      return [
        <Button className="w-full" key="open-billings" leadingIcon={<CreditCard className="size-4" />} onClick={() => router.push("/minha-assinatura/faturas")}>
          Abrir faturas
        </Button>
      ];
    }

    if (activePlan.status === "PENDING_CANCELLATION" && canManagePlans) {
      return [
        <Button
          className="w-full"
          key="revert-cancellation"
          onClick={() =>
            openDialog({
              kind: "revert",
              title: "Reverter cancelamento",
              description: "O tenant volta ao estado ativo e mantem o mesmo ciclo contratado.",
              confirmLabel: "Reverter cancelamento"
            })
          }
          variant="outline"
        >
          Reverter cancelamento
        </Button>
      ];
    }

    if (activePlan.isTrial) {
      return [
        ...(canManagePlans && Number(activePlan.plan.price) > 0
          ? [
            <Button
              className="w-full"
              key="subscribe-current-plan"
              onClick={() =>
                openDialog({
                  kind: "upgrade",
                  title: `Assinar ${activePlan.plan.displayName}`,
                  description: `O tenant sai do trial e inicia um ciclo contratado em ${activePlan.plan.displayName}.`,
                  confirmLabel: `Assinar ${activePlan.plan.displayName}`,
                  targetPlanId: activePlan.plan.id
                })
              }
            >
              Assinar este plano
            </Button>
          ]
          : []),
        ...(canManagePlans
          ? [
            <Button
              className="w-full"
              key="terminate-trial"
              onClick={() =>
                openDialog({
                  kind: "terminateTrial",
                  title: "Encerrar trial",
                  description:
                    activePlan.fallbackPlan && Number(activePlan.fallbackPlan.price) > 0
                      ? `O sistema vai retomar ${activePlan.fallbackPlan.displayName} automaticamente.`
                      : "Selecione o plano que deve assumir assim que o trial for encerrado.",
                  confirmLabel: "Encerrar trial",
                  requiresPlanSelection: !(activePlan.fallbackPlan && Number(activePlan.fallbackPlan.price) > 0),
                  planOptions: availableTerminateTargets
                })
              }
              variant="outline"
            >
              Encerrar trial
            </Button>
          ]
          : []),
      ];
    }

    if (Number(activePlan.plan.price) === 0) {
      return [];
    }

    return [
      ...(canManagePlans
        ? [
          <Button
            className="w-full"
            key="schedule-change"
            onClick={() =>
              openDialog({
                kind: "cancel",
                title: "Agendar mudanca de plano",
                description: "O downgrade ocorre no fim do periodo atual. Escolha o plano que deve assumir depois disso.",
                confirmLabel: "Agendar mudanca",
                requiresPlanSelection: true,
                planOptions: availableDowngradeTargets
              })
            }
            variant="outline"
          >
            Agendar mudanca
          </Button>
        ]
        : [])
    ];
  }

  function renderPlanPrimaryAction(plan: SubscriptionPlan) {
    if (!activePlan) return null;

    if (plan.id === activePlan.plan.id) {
      return <Button className="w-full" disabled variant="outline">Plano atual</Button>;
    }

    if (!canManagePlans) return null;

    if (activePlan.status === "PENDING_CANCELLATION") {
      return <Button className="w-full" disabled variant="outline">Reverta o cancelamento para trocar</Button>;
    }

    if (activePlan.isTrial) {
      if (Number(plan.price) > 0) {
        return (
          <Button
            className="w-full"
            onClick={() =>
              openDialog({
                kind: "upgrade",
                title: `Assinar ${plan.displayName}`,
                description: `O tenant passa a usar ${plan.displayName} como plano contratado.`,
                confirmLabel: `Assinar ${plan.displayName}`,
                targetPlanId: plan.id
              })
            }
          >
            Assinar este plano
          </Button>
        );
      }

      return (
        <Button
          className="w-full"
          onClick={() =>
            openDialog({
              kind: "terminateTrial",
              title: "Encerrar trial no plano gratuito",
              description: "O tenant encerrara o trial e passara a usar o plano gratuito imediatamente.",
              confirmLabel: "Encerrar no Gratuito",
              requiresPlanSelection: true,
              planOptions: [plan]
            })
          }
          variant="outline"
        >
          Encerrar trial aqui
        </Button>
      );
    }

    if (plan.sortOrder > activePlan.plan.sortOrder) {
      return (
        <Button
          className="w-full"
          onClick={() =>
            openDialog({
              kind: "upgrade",
              title: `Fazer upgrade para ${plan.displayName}`,
              description: "O backend calcula automaticamente a cobranca proporcional quando necessario.",
              confirmLabel: `Fazer upgrade para ${plan.displayName}`,
              targetPlanId: plan.id
            })
          }
        >
          Fazer upgrade
        </Button>
      );
    }

    return (
      <Button
        className="w-full"
        onClick={() =>
          openDialog({
            kind: "cancel",
            title: `Agendar mudanca para ${plan.displayName}`,
            description: "O plano atual continua ativo ate o fim do periodo contratado. Depois disso, a mudanca e aplicada automaticamente.",
            confirmLabel: `Agendar mudanca para ${plan.displayName}`,
            requiresPlanSelection: true,
            planOptions: [plan],
            targetPlanId: plan.id
          })
        }
        variant="outline"
      >
        Agendar mudanca
      </Button>
    );
  }

  function renderPlanSecondaryAction(plan: SubscriptionPlan) {
    if (!activePlan || !canManagePlans || activePlan.isTrial || activePlan.status === "PENDING_CANCELLATION") return null;
    if (Number(plan.price) === 0 || plan.id === activePlan.plan.id) return null;

    return (
      <Button
        className="w-full"
        onClick={() =>
          openDialog({
            kind: "trial",
            title: `Iniciar trial de ${plan.displayName}`,
            description: "Cada plano permite um unico trial por tenant. Se ele ja tiver sido usado, o backend retornara erro de negocio.",
            confirmLabel: `Testar ${plan.displayName}`,
            targetPlanId: plan.id
          })
        }
        variant="ghost"
      >
        Testar 30 dias
      </Button>
    );
  }

  function renderPlans() {
    if (!plans.length) {
      return <Card><CardContent className="p-6 text-sm text-[var(--color-muted-foreground)]">Nenhum plano ativo foi retornado pelo contrato.</CardContent></Card>;
    }

    const daysRemaining = getDaysRemaining(activePlan?.endDate);

    return (
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = activePlan?.plan.id === plan.id;
            const currentPlanDetails = isCurrentPlan && activePlan
              ? {
                  statusLabel: tenant?.status === "SUSPENDED" ? "Suspenso" : toPlanStatusLabel(activePlan),
                  summary: toTenantStatusMessage(tenant, activePlan),
                  cycleLabel: `${formatDate(activePlan.startDate)} - ${activePlan.endDate ? formatDate(activePlan.endDate) : "Permanente"}`,
                  remainingLabel: daysRemaining == null ? "Sem prazo de expiracao" : `${daysRemaining} dia(s) restantes`,
                  billingLabel: outstandingBilling
                    ? `${toBillingLabel(outstandingBilling.status)} com vencimento em ${formatDate(outstandingBilling.dueDate)}`
                    : "Nenhuma pendencia encontrada."
                }
              : null;

            return (
              <Card className={cn("flex h-full flex-col", isCurrentPlan ? "border-[var(--color-primary)] shadow-[var(--shadow-soft)]" : "")} key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{plan.displayName}</CardTitle>
                      <CardDescription>{plan.name}</CardDescription>
                    </div>
                    {isCurrentPlan ? (
                      <Badge variant={tenant?.status === "SUSPENDED" ? "attention" : "success"}>
                        {currentPlanDetails?.statusLabel ?? "Plano atual"}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-3xl font-semibold text-[var(--color-foreground)]">{formatCurrency(plan.price)}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5">
                  {currentPlanDetails ? (
                    <div className="space-y-3">
                      <p className="text-sm text-[var(--color-muted-foreground)]">{currentPlanDetails.summary}</p>
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">Vigencia</p>
                        <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">{currentPlanDetails.cycleLabel}</p>
                        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{currentPlanDetails.remainingLabel}</p>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">Financeiro</p>
                        <p className="mt-2 text-sm text-[var(--color-foreground)]">{currentPlanDetails.billingLabel}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Abra os detalhes para consultar limites e funcionalidades antes de confirmar a mudanca.
                    </p>
                  )}
                  <div className="mt-auto space-y-3">
                    {isCurrentPlan && renderSummaryActions()?.length ? renderSummaryActions() : renderPlanPrimaryAction(plan)}
                    {!isCurrentPlan ? renderPlanSecondaryAction(plan) : null}
                    <Button className="w-full" onClick={() => setPlanDetails({ plan })} variant="outline">
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    );
  }

  function loadBillingsPage(direction: "next" | "previous") {
    if (!billingsConnection) return;

    const variables: GetMyBillingsVariables =
      direction === "next"
        ? { first: 10, after: billingsConnection.pageInfo.endCursor, order: [{ dueDate: "DESC" }] }
        : { last: 10, before: billingsConnection.pageInfo.startCursor, order: [{ dueDate: "DESC" }] };

    if ((direction === "next" && !billingsConnection.pageInfo.endCursor) || (direction === "previous" && !billingsConnection.pageInfo.startCursor)) {
      return;
    }

    void (async () => {
      try {
        setIsLoadingBillings(true);
        const response = await getMyBillings(variables);
        setBillingsConnection(response);
      } catch (error) {
        setFeedback({ tone: "error", message: mapSubscriptionApiError(error) });
      } finally {
        setIsLoadingBillings(false);
      }
    })();
  }

  function renderBillings() {
    if (!canManagePlans) {
      return (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-[var(--color-muted-foreground)]">
            <ShieldAlert className="size-5 text-[var(--color-secondary)]" />
            Esta area exige a permissao `plans:manage`.
          </CardContent>
        </Card>
      );
    }

    if (isLoadingBillings && !billingsConnection) {
      return <Card><CardContent className="flex items-center gap-3 p-6 text-sm text-[var(--color-muted-foreground)]"><Loader2 className="size-4 animate-spin" />Carregando cobrancas do tenant...</CardContent></Card>;
    }

    if (!billingsConnection?.nodes.length) {
      return <Card><CardContent className="p-6 text-sm text-[var(--color-muted-foreground)]">Nenhuma cobranca foi encontrada para o tenant atual.</CardContent></Card>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Historico de faturas</CardTitle>
          <CardDescription>As cobrancas usam o status real retornado pelo backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-sm text-[var(--color-muted-foreground)]">
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Referencia</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {billingsConnection.nodes.map((billing) => (
                  <tr className="border-t border-[var(--color-border)]" key={billing.id}>
                    <td className="px-4 py-3">{billing.tenantPlan.plan.displayName}</td>
                    <td className="px-4 py-3">{billing.referenceMonth}</td>
                    <td className="px-4 py-3">{formatDate(billing.dueDate)}</td>
                    <td className="px-4 py-3">{formatCurrency(billing.amount)}</td>
                    <td className="px-4 py-3"><Badge variant={toBillingVariant(billing.status)}>{toBillingLabel(billing.status)}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {(billing.status === "PENDING" || billing.status === "OVERDUE") ? (
                          <Button
                            onClick={() =>
                              openDialog({
                                kind: "payBilling",
                                title: "Confirmar pagamento",
                                description: "Ao marcar esta fatura como paga, o tenant pode voltar imediatamente ao estado ativo.",
                                confirmLabel: "Marcar como paga",
                                targetBillingId: billing.id
                              })
                            }
                            size="sm"
                          >
                            Pagar
                          </Button>
                        ) : null}
                        {billing.invoiceUrl ? (
                          <Button onClick={() => window.open(billing.invoiceUrl ?? "#", "_blank", "noopener,noreferrer")} size="sm" variant="outline">
                            Ver fatura
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">{billingsConnection.totalCount} cobranca(s) encontradas.</p>
            <div className="flex gap-2">
              <Button disabled={!billingsConnection.pageInfo.hasPreviousPage || isLoadingBillings} onClick={() => loadBillingsPage("previous")} size="sm" variant="outline">Anterior</Button>
              <Button disabled={!billingsConnection.pageInfo.hasNextPage || isLoadingBillings} onClick={() => loadBillingsPage("next")} size="sm" variant="outline">Proxima</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FeatureViewHeader
        backAriaLabel="Voltar para o dashboard"
        backHref="/"
        description="Gerencie plano, trial, cobrancas e o estado comercial do tenant autenticado."
        title="Minha assinatura"
      />

      {feedback ? (
        <Card className={cn(feedback.tone === "error" ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50")}>
          <CardContent className="flex items-start gap-3 p-4">
            {feedback.tone === "error" ? <AlertCircle className="mt-0.5 size-5 text-red-600" /> : <Check className="mt-0.5 size-5 text-emerald-600" />}
            <p className={cn("text-sm font-medium", feedback.tone === "error" ? "text-red-700" : "text-emerald-700")}>{feedback.message}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoadingBase ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-[var(--color-muted-foreground)]">
            <Loader2 className="size-4 animate-spin" />
            Carregando dados da assinatura...
          </CardContent>
        </Card>
      ) : null}

      {!isLoadingBase && section === "plans" ? renderPlans() : null}
      {!isLoadingBase && section === "billings" ? renderBillings() : null}

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4" role="dialog">
          <div className="w-full max-w-lg rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="space-y-2">
              <p className="text-xl font-semibold text-[var(--color-foreground)]">{dialog.title}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">{dialog.description}</p>
            </div>

            {dialog.requiresPlanSelection ? (
              <div className="mt-5 space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="target-plan">
                  Plano de destino
                </label>
                <select
                  className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)]"
                  id="target-plan"
                  onChange={(event) => setSelectedTargetPlanId(event.target.value)}
                  value={selectedTargetPlanId}
                >
                  {(dialog.planOptions ?? []).map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.displayName} - {formatCurrency(plan.price)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button disabled={isMutating} onClick={() => setDialog(null)} variant="outline">
                Cancelar
              </Button>
              <Button
                disabled={isMutating || (dialog.requiresPlanSelection && !selectedTargetPlanId)}
                leadingIcon={isMutating ? <Loader2 className="size-4 animate-spin" /> : undefined}
                onClick={() => void confirmDialog()}
              >
                {dialog.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {planDetails ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4" role="dialog">
          <div className="w-full max-w-3xl rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xl font-semibold text-[var(--color-foreground)]">{planDetails.plan.displayName}</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {planDetails.plan.name} · {formatCurrency(planDetails.plan.price)}
                </p>
              </div>
              <Button onClick={() => setPlanDetails(null)} variant="outline">
                Fechar
              </Button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {planDetails.plan.planFeatures.map((planFeature) => (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4" key={planFeature.id}>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{planFeature.feature.description}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{planFeature.feature.key}</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-foreground)]">{formatFeatureValue(planFeature)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
