"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import {
  deleteTenant,
  getTenantById,
  getTenantCompanyById,
  mapTenantApiError,
  updateTenant,
  type TenantCompanyLink
} from "@/features/tenants/api/tenant-upsert";
import {
  tenantRegistrationSchema,
  type TenantRegistrationSchema
} from "@/features/tenants/schema/tenant-registration-schema";
import { cn } from "@/lib/utils/cn";

type TenantTabKey = "general" | "plan";

const tabs: Array<{ key: TenantTabKey; label: string; description: string }> = [
  { key: "general", label: "Informacoes gerais", description: "Dados principais e empresa vinculada ao tenant." },
  { key: "plan", label: "Plano", description: "Configuracao do plano e status comercial do tenant." }
];

const statusOptions = [
  { value: "TRIAL", label: "Teste" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "SUSPENDED", label: "Suspenso" },
  { value: "CANCELLED", label: "Cancelado" }
] as const;

const planOptions = [
  { value: "FREE", label: "Free" },
  { value: "BASIC", label: "Basic" },
  { value: "PREMIUM", label: "Premium" }
] as const;

function toDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

export function TenantRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const tenantId = searchParams.get("id");
  const [selectedTab, setSelectedTab] = useState<TenantTabKey>("general");
  const [isLoadingTenant, setIsLoadingTenant] = useState(isEditMode && Boolean(tenantId));
  const [company, setCompany] = useState<TenantCompanyLink | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Tenant atualizado com sucesso.");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TenantRegistrationSchema>({
    resolver: zodResolver(tenantRegistrationSchema),
    defaultValues: {
      name: "",
      status: "TRIAL",
      plan: "FREE"
    }
  });

  useEffect(() => {
    if (!isEditMode || !tenantId) {
      setIsLoadingTenant(false);
      setFormError("A tela de gerenciamento de tenant esta disponivel apenas no modo de edicao.");
      return;
    }

    let isMounted = true;
    const currentTenantId = tenantId;

    async function loadTenant() {
      try {
        setIsLoadingTenant(true);
        setFormError(null);

        const tenant = await getTenantById(currentTenantId);
        if (!isMounted) return;

        if (!tenant) {
          setFormError("Tenant nao encontrado.");
          return;
        }

        reset({
          name: tenant.name,
          status: tenant.status,
          plan: tenant.plan
        });
        setCompanyId(tenant.companyId);
        setCreatedAt(tenant.createdAt ?? null);
        setUpdatedAt(tenant.updatedAt ?? null);

        const linkedCompany = await getTenantCompanyById(tenant.companyId).catch(() => null);
        if (!isMounted) return;
        setCompany(linkedCompany);
      } catch (error) {
        if (!isMounted) return;
        setFormError(mapTenantApiError(error));
      } finally {
        if (isMounted) {
          setIsLoadingTenant(false);
        }
      }
    }

    loadTenant();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, reset, tenantId]);

  useEffect(() => {
    if (!isSuccessModalOpen) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/assinaturas/tenants/pesquisa");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalOpen, router]);

  async function onSubmit(values: TenantRegistrationSchema) {
    if (!isEditMode || !tenantId) {
      setFormError("Tenant invalido para atualizacao.");
      return;
    }

    try {
      setFormError(null);
      await updateTenant(tenantId, values);
      setSuccessMessage("Tenant atualizado com sucesso.");
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapTenantApiError(error));
    }
  }

  async function confirmDeleteTenant() {
    if (!isEditMode || !tenantId) return;

    try {
      setFormError(null);
      setIsDeleteConfirmOpen(false);
      setIsDeletingTenant(true);

      const deleted = await deleteTenant(tenantId);
      if (!deleted) {
        setFormError("Nao foi possivel excluir o tenant.");
        return;
      }

      setSuccessMessage("Tenant excluido com sucesso.");
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapTenantApiError(error));
    } finally {
      setIsDeletingTenant(false);
    }
  }

  return (
    <div className="space-y-6">
      <FeatureViewHeader
        actions={
          <>
            {isEditMode ? (
              <Button
                className="min-w-40"
                disabled={isSubmitting || isLoadingTenant || isSuccessModalOpen || isDeletingTenant || isDeleteConfirmOpen}
                leadingIcon={isDeletingTenant ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                onClick={() => setIsDeleteConfirmOpen(true)}
                type="button"
                variant="danger-outline"
              >
                {isDeletingTenant ? "Excluindo..." : "Excluir"}
              </Button>
            ) : null}
            <Button
              className="min-w-40"
              disabled={isSubmitting || isLoadingTenant || isSuccessModalOpen || isDeletingTenant || isDeleteConfirmOpen}
              form="tenant-form"
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              type="submit"
            >
              Salvar
            </Button>
          </>
        }
        backAriaLabel="Voltar para pesquisa de tenants"
        backHref="/assinaturas/tenants/pesquisa"
        description="Gerencie as configuracoes principais do tenant."
        title={<span className="text-xl">{isEditMode ? "Gerenciar tenant" : "Tenant"}</span>}
      />

      {formError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-red-700">{formError}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="p-3">
            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  className={cn(
                    "rounded-[var(--radius-md)] border px-4 py-3 text-left transition",
                    selectedTab === tab.key
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
                      : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                  )}
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  type="button"
                >
                  <p className="text-sm font-semibold">{tab.label}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{tab.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <form className="space-y-6" id="tenant-form" onSubmit={handleSubmit(onSubmit)}>
          {isLoadingTenant ? (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="size-4 animate-spin" />
                Carregando dados do tenant...
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "general" ? (
            <Card>
              <CardHeader>
                <CardTitle>Informacoes gerais</CardTitle>
                <CardDescription>Dados principais do tenant e da empresa vinculada.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field className="md:col-span-2">
                  <FieldLabel htmlFor="tenant-name">Nome do tenant</FieldLabel>
                  <Input id="tenant-name" placeholder="Nome do tenant" {...register("name")} />
                  {errors.name ? <FieldMessage>{errors.name.message}</FieldMessage> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="tenant-company">Empresa vinculada</FieldLabel>
                  <Input
                    aria-readonly="true"
                    className="cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted-foreground)] focus:border-[var(--color-border)] focus:ring-0"
                    id="tenant-company"
                    readOnly
                    value={company?.legalName ?? "-"}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="tenant-company-id">Company ID</FieldLabel>
                  <Input
                    aria-readonly="true"
                    className="cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] font-mono text-xs text-[var(--color-muted-foreground)] focus:border-[var(--color-border)] focus:ring-0"
                    id="tenant-company-id"
                    readOnly
                    value={companyId || "-"}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="tenant-status">Status</FieldLabel>
                  <select
                    className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)]"
                    id="tenant-status"
                    {...register("status")}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {errors.status ? <FieldMessage>{errors.status.message}</FieldMessage> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="tenant-created-at">Criado em</FieldLabel>
                  <Input
                    aria-readonly="true"
                    className="cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted-foreground)] focus:border-[var(--color-border)] focus:ring-0"
                    id="tenant-created-at"
                    readOnly
                    value={toDateTime(createdAt)}
                  />
                </Field>
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "plan" ? (
            <Card>
              <CardHeader>
                <CardTitle>Plano</CardTitle>
                <CardDescription>Gerencie o plano atual e acompanhe a ultima atualizacao.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="tenant-plan">Plano atual</FieldLabel>
                  <select
                    className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)]"
                    id="tenant-plan"
                    {...register("plan")}
                  >
                    {planOptions.map((plan) => (
                      <option key={plan.value} value={plan.value}>
                        {plan.label}
                      </option>
                    ))}
                  </select>
                  {errors.plan ? <FieldMessage>{errors.plan.message}</FieldMessage> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="tenant-updated-at">Ultima atualizacao</FieldLabel>
                  <Input
                    aria-readonly="true"
                    className="cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted-foreground)] focus:border-[var(--color-border)] focus:ring-0"
                    id="tenant-updated-at"
                    readOnly
                    value={toDateTime(updatedAt)}
                  />
                </Field>
              </CardContent>
            </Card>
          ) : null}
        </form>
      </div>

      {isSuccessModalOpen ? (
        <div
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-[var(--color-foreground)]">{successMessage}</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Redirecionando para a listagem de tenants...
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmationDialog
        description="Deseja excluir este tenant? Esta acao nao podera ser desfeita."
        isConfirming={isDeletingTenant}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteTenant}
        open={isDeleteConfirmOpen}
      />
    </div>
  );
}
