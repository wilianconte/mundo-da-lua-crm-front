"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eraser, Loader2, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import {
  createCompany,
  deleteCompany,
  getCompanyById,
  mapCompanyApiError,
  setCompanyAddress,
  updateCompany,
  type SetCompanyAddressInput
} from "@/features/empresas/api/company-upsert";
import {
  companyRegistrationSchema,
  type CompanyRegistrationSchema
} from "@/features/empresas/schema/company-registration-schema";
import { cn } from "@/lib/utils/cn";

type CompanyTabKey = "main" | "contact" | "address" | "additional";

const companyTabs: Array<{ key: CompanyTabKey; label: string; description: string }> = [
  { key: "main", label: "Dados principais", description: "Identificacao fiscal e canais principais." },
  { key: "contact", label: "Contato responsavel", description: "Pessoa principal para relacionamento comercial." },
  { key: "address", label: "Endereco", description: "Dados de localizacao para setCompanyAddress." },
  { key: "additional", label: "Informacoes adicionais", description: "Imagem de perfil e observacoes gerais." }
];

const COMPANY_TYPE_OPTIONS = [
  { value: "SUPPLIER", label: "Fornecedor" },
  { value: "PARTNER", label: "Parceiro" },
  { value: "SCHOOL", label: "Escola" },
  { value: "CORPORATE_CUSTOMER", label: "Cliente corporativo" },
  { value: "BILLING_ACCOUNT", label: "Conta faturamento" },
  { value: "SERVICE_PROVIDER", label: "Prestador" },
  { value: "SPONSOR", label: "Patrocinador" },
  { value: "OTHER", label: "Outro" }
] as const;

function toDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCnpj(value: string) {
  const digits = toDigits(value).slice(0, 14);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function maskPhone(value: string) {
  const digits = toDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function maskZipCode(value: string) {
  const digits = toDigits(value).slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function CompanyRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const companyId = searchParams.get("id");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Cadastro realizado com sucesso.");
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<CompanyTabKey>("main");
  const [formError, setFormError] = useState<string | null>(null);

  const initialValues = useMemo<CompanyRegistrationSchema>(
    () => ({
      legalName: "",
      tradeName: "",
      registrationNumber: "",
      stateRegistration: "",
      municipalRegistration: "",
      email: "",
      primaryPhone: "",
      secondaryPhone: "",
      whatsAppNumber: "",
      website: "",
      contactPersonName: "",
      contactPersonEmail: "",
      contactPersonPhone: "",
      companyType: undefined,
      industry: "",
      profileImageUrl: "",
      notes: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    }),
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CompanyRegistrationSchema>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: initialValues
  });

  const profileImageUrl = watch("profileImageUrl");

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    if (!isSuccessModalOpen) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/empresas/pesquisa");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalOpen, router]);

  useEffect(() => {
    if (!isEditMode || !companyId) return;
    const currentCompanyId = companyId;

    let isMounted = true;

    async function loadCompany() {
      try {
        setIsLoadingCompany(true);
        setFormError(null);

        const company = await getCompanyById(currentCompanyId);
        if (!isMounted) return;

        if (!company) {
          setFormError("Empresa nao encontrada.");
          return;
        }

        reset({
          legalName: company.legalName ?? "",
          tradeName: company.tradeName ?? "",
          registrationNumber: company.registrationNumber ? maskCnpj(company.registrationNumber) : "",
          stateRegistration: company.stateRegistration ?? "",
          municipalRegistration: company.municipalRegistration ?? "",
          email: company.email ?? "",
          primaryPhone: company.primaryPhone ? maskPhone(company.primaryPhone) : "",
          secondaryPhone: company.secondaryPhone ? maskPhone(company.secondaryPhone) : "",
          whatsAppNumber: company.whatsAppNumber ? maskPhone(company.whatsAppNumber) : "",
          website: company.website ?? "",
          contactPersonName: company.contactPersonName ?? "",
          contactPersonEmail: company.contactPersonEmail ?? "",
          contactPersonPhone: company.contactPersonPhone ? maskPhone(company.contactPersonPhone) : "",
          companyType: company.companyType ?? undefined,
          industry: company.industry ?? "",
          profileImageUrl: company.profileImageUrl ?? "",
          notes: company.notes ?? "",
          street: company.address?.street ?? "",
          number: company.address?.number ?? "",
          complement: company.address?.complement ?? "",
          neighborhood: company.address?.neighborhood ?? "",
          city: company.address?.city ?? "",
          state: company.address?.state ?? "",
          zipCode: company.address?.zipCode ? maskZipCode(company.address.zipCode) : "",
          country: company.address?.country ?? ""
        });
      } catch (error) {
        if (!isMounted) return;
        setFormError(mapCompanyApiError(error));
      } finally {
        if (isMounted) {
          setIsLoadingCompany(false);
        }
      }
    }

    loadCompany();

    return () => {
      isMounted = false;
    };
  }, [companyId, isEditMode, reset]);

  useEffect(() => {
    if (isEditMode && !companyId) {
      setFormError("Empresa nao encontrada.");
    }
  }, [companyId, isEditMode]);

  async function persistAddress(nextCompanyId: string, values: CompanyRegistrationSchema) {
    const hasAddress = Boolean(
      values.street ||
        values.number ||
        values.complement ||
        values.neighborhood ||
        values.city ||
        values.state ||
        values.zipCode ||
        values.country
    );

    if (!hasAddress || !values.street || !values.neighborhood || !values.city || !values.state || !values.zipCode) {
      return;
    }

    const addressPayload: SetCompanyAddressInput = {
      companyId: nextCompanyId,
      street: values.street,
      number: values.number,
      complement: values.complement,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state.toUpperCase(),
      zipCode: values.zipCode,
      country: (values.country || "BR").toUpperCase()
    };

    await setCompanyAddress(addressPayload);
  }

  async function onSubmit(values: CompanyRegistrationSchema) {
    try {
      setFormError(null);
      const payload = {
        legalName: values.legalName,
        tradeName: values.tradeName,
        registrationNumber: values.registrationNumber ? toDigits(values.registrationNumber) : undefined,
        stateRegistration: values.stateRegistration,
        municipalRegistration: values.municipalRegistration,
        email: values.email,
        primaryPhone: values.primaryPhone ? toDigits(values.primaryPhone) : undefined,
        secondaryPhone: values.secondaryPhone ? toDigits(values.secondaryPhone) : undefined,
        whatsAppNumber: values.whatsAppNumber ? toDigits(values.whatsAppNumber) : undefined,
        website: values.website,
        contactPersonName: values.contactPersonName,
        contactPersonEmail: values.contactPersonEmail,
        contactPersonPhone: values.contactPersonPhone ? toDigits(values.contactPersonPhone) : undefined,
        companyType: values.companyType,
        industry: values.industry,
        profileImageUrl: values.profileImageUrl,
        notes: values.notes
      };

      const currentCompanyId = companyId;
      const company =
        isEditMode && currentCompanyId ? await updateCompany(currentCompanyId, payload) : await createCompany(payload);
      await persistAddress(company.id, values);

      setSuccessMessage(isEditMode ? "Alteracao realizada com sucesso." : "Cadastro realizado com sucesso.");
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapCompanyApiError(error));
    }
  }

  async function confirmDeleteCompany() {
    if (!companyId || !isEditMode) return;

    try {
      setFormError(null);
      setIsDeletingCompany(true);
      setIsDeleteConfirmOpen(false);
      const deleted = await deleteCompany(companyId);
      if (!deleted) {
        setFormError("Nao foi possivel excluir a empresa.");
        return;
      }

      setSuccessMessage("Empresa excluida com sucesso.");
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapCompanyApiError(error));
    } finally {
      setIsDeletingCompany(false);
    }
  }

  function handleClear() {
    reset(initialValues);
    setFormError(null);
  }

  function ensureAddressCountryDefault(nextValue: string) {
    if (!nextValue.trim()) {
      return;
    }

    const currentCountry = watch("country") ?? "";
    if (currentCountry.trim()) {
      return;
    }

    setValue("country", "BR", { shouldDirty: true, shouldValidate: true });
  }

  return (
    <div className="space-y-6">
      <FeatureViewHeader
        actions={
          <>
            <Button
              disabled={isSubmitting || isLoadingCompany || isDeletingCompany || isSuccessModalOpen || isDeleteConfirmOpen}
              leadingIcon={<Eraser className="size-4" />}
              onClick={handleClear}
              type="button"
              variant="outline"
            >
              Limpar
            </Button>
            <Button
              disabled={isSubmitting || isLoadingCompany || isDeletingCompany || isSuccessModalOpen || isDeleteConfirmOpen}
              leadingIcon={<X className="size-4" />}
              onClick={() => router.push("/empresas/pesquisa")}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            {isEditMode ? (
              <Button
                disabled={
                  isSubmitting || isLoadingCompany || isDeletingCompany || isSuccessModalOpen || isDeleteConfirmOpen
                }
                leadingIcon={isDeletingCompany ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                onClick={() => setIsDeleteConfirmOpen(true)}
                variant="danger-outline"
              >
                {isDeletingCompany ? "Excluindo..." : "Excluir"}
              </Button>
            ) : null}
            <Button
              disabled={isSubmitting || isLoadingCompany || isDeletingCompany || isSuccessModalOpen || isDeleteConfirmOpen}
              form="company-form"
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              type="submit"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
        backAriaLabel="Voltar para pesquisa de empresas"
        backHref="/empresas/pesquisa"
        description={
          isEditMode
            ? "Atualize dados cadastrais, contato principal e endereco da empresa."
            : "Preencha os dados essenciais para criar uma nova empresa no CRM."
        }
        title={<span className="text-xl">{isEditMode ? "Edicao de empresa" : "Cadastro de empresa"}</span>}
      />

      {formError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-danger-strong)]">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="p-3">
            <div className="flex flex-col gap-2">
              {companyTabs.map((tab) => (
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

        <form className="space-y-6" id="company-form" onSubmit={handleSubmit(onSubmit)}>
          {isLoadingCompany ? (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="size-4 animate-spin" />
                Carregando dados da empresa...
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "main" ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[var(--color-surface-muted)] p-2 text-[var(--color-primary)]">
                        <Building2 className="size-4" />
                      </div>
                      <CardTitle>{isEditMode ? "Editar cadastro" : "Nova empresa"}</CardTitle>
                    </div>
                    <CardDescription>
                      Use a razao social como identificador principal e preencha os dados fiscais e canais de contato.
                    </CardDescription>
                  </div>
                  <Badge variant="attention">Razao social obrigatoria</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field className="md:col-span-2">
                  <FieldLabel htmlFor="legalName">Razao social</FieldLabel>
                  <Input id="legalName" placeholder="Empresa Exemplo Ltda" {...register("legalName")} />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.legalName?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="tradeName">Nome fantasia</FieldLabel>
                  <Input id="tradeName" placeholder="Empresa Exemplo" {...register("tradeName")} />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.tradeName?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="registrationNumber">CNPJ</FieldLabel>
                  <Input
                    id="registrationNumber"
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    {...register("registrationNumber")}
                    onChange={(event) => setValue("registrationNumber", maskCnpj(event.target.value))}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.registrationNumber?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="stateRegistration">Inscricao estadual</FieldLabel>
                  <Input id="stateRegistration" {...register("stateRegistration")} />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.stateRegistration?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="municipalRegistration">Inscricao municipal</FieldLabel>
                  <Input id="municipalRegistration" {...register("municipalRegistration")} />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.municipalRegistration?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="companyType">Tipo da empresa</FieldLabel>
                  <select
                    className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm"
                    id="companyType"
                    {...register("companyType")}
                  >
                    <option value="">Selecione</option>
                    {COMPANY_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.companyType?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="industry">Segmento</FieldLabel>
                  <Input id="industry" placeholder="Tecnologia" {...register("industry")} />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.industry?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" placeholder="contato@empresa.com" type="email" {...register("email")} />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.email?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <Input id="website" placeholder="https://empresa.com" {...register("website")} />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.website?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="primaryPhone">Telefone principal</FieldLabel>
                  <Input
                    id="primaryPhone"
                    {...register("primaryPhone")}
                    onChange={(event) => setValue("primaryPhone", maskPhone(event.target.value))}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.primaryPhone?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="secondaryPhone">Telefone secundario</FieldLabel>
                  <Input
                    id="secondaryPhone"
                    {...register("secondaryPhone")}
                    onChange={(event) => setValue("secondaryPhone", maskPhone(event.target.value))}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.secondaryPhone?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="whatsAppNumber">WhatsApp</FieldLabel>
                  <Input
                    id="whatsAppNumber"
                    {...register("whatsAppNumber")}
                    onChange={(event) => setValue("whatsAppNumber", maskPhone(event.target.value))}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.whatsAppNumber?.message}</FieldMessage>
                </Field>
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "contact" ? (
            <Card>
              <CardHeader>
                <CardTitle>Contato responsavel</CardTitle>
                <CardDescription>
                  Dados da pessoa principal para relacionamento comercial.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="contactPersonName">Nome do contato</FieldLabel>
                  <Input id="contactPersonName" {...register("contactPersonName")} />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.contactPersonName?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="contactPersonEmail">Email do contato</FieldLabel>
                  <Input id="contactPersonEmail" type="email" {...register("contactPersonEmail")} />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.contactPersonEmail?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="contactPersonPhone">Telefone do contato</FieldLabel>
                  <Input
                    id="contactPersonPhone"
                    {...register("contactPersonPhone")}
                    onChange={(event) => setValue("contactPersonPhone", maskPhone(event.target.value))}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.contactPersonPhone?.message}</FieldMessage>
                </Field>
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "address" ? (
            <Card>
              <CardHeader>
                <CardTitle>Endereco</CardTitle>
                <CardDescription>
                  Se preenchido, o endereco sera enviado via setCompanyAddress apos salvar a empresa.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="street">Rua</FieldLabel>
                  <Input
                    id="street"
                    {...register("street")}
                    onChange={(event) => {
                      const value = event.target.value;
                      setValue("street", value, { shouldDirty: true, shouldValidate: true });
                      ensureAddressCountryDefault(value);
                    }}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.street?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="number">Numero</FieldLabel>
                  <Input
                    id="number"
                    {...register("number")}
                    onChange={(event) => {
                      const value = event.target.value;
                      setValue("number", value, { shouldDirty: true, shouldValidate: true });
                      ensureAddressCountryDefault(value);
                    }}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.number?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="complement">Complemento</FieldLabel>
                  <Input
                    id="complement"
                    {...register("complement")}
                    onChange={(event) => {
                      const value = event.target.value;
                      setValue("complement", value, { shouldDirty: true, shouldValidate: true });
                      ensureAddressCountryDefault(value);
                    }}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.complement?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="neighborhood">Bairro</FieldLabel>
                  <Input
                    id="neighborhood"
                    {...register("neighborhood")}
                    onChange={(event) => {
                      const value = event.target.value;
                      setValue("neighborhood", value, { shouldDirty: true, shouldValidate: true });
                      ensureAddressCountryDefault(value);
                    }}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.neighborhood?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="city">Cidade</FieldLabel>
                  <Input
                    id="city"
                    {...register("city")}
                    onChange={(event) => {
                      const value = event.target.value;
                      setValue("city", value, { shouldDirty: true, shouldValidate: true });
                      ensureAddressCountryDefault(value);
                    }}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.city?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="state">UF</FieldLabel>
                  <Input
                    id="state"
                    maxLength={2}
                    {...register("state")}
                    onChange={(event) => {
                      const value = event.target.value.toUpperCase();
                      setValue("state", value, { shouldDirty: true, shouldValidate: true });
                      ensureAddressCountryDefault(value);
                    }}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.state?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="zipCode">CEP</FieldLabel>
                  <Input
                    id="zipCode"
                    inputMode="numeric"
                    {...register("zipCode")}
                    onChange={(event) => {
                      const value = maskZipCode(event.target.value);
                      setValue("zipCode", value, { shouldDirty: true, shouldValidate: true });
                      ensureAddressCountryDefault(value);
                    }}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.zipCode?.message}</FieldMessage>
                </Field>
                <Field>
                  <FieldLabel htmlFor="country">Pais</FieldLabel>
                  <Input
                    id="country"
                    maxLength={2}
                    {...register("country")}
                    onChange={(event) => setValue("country", event.target.value.toUpperCase())}
                  />
                  <FieldMessage className="text-[var(--color-danger-strong)]">{errors.country?.message}</FieldMessage>
                </Field>
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "additional" ? (
            <Card>
              <CardHeader>
                <CardTitle>Informacoes adicionais</CardTitle>
                <CardDescription>
                  Imagem de perfil, observacoes e referencias complementares.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <Field>
                    <FieldLabel htmlFor="profileImageUrl">URL da imagem</FieldLabel>
                    <Input id="profileImageUrl" placeholder="https://cdn.../logo.png" {...register("profileImageUrl")} />
                    <FieldMessage className="text-[var(--color-danger-strong)]">{errors.profileImageUrl?.message}</FieldMessage>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="notes">Observacoes</FieldLabel>
                    <textarea
                      className="min-h-32 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                      id="notes"
                      {...register("notes")}
                    />
                    <FieldMessage className="text-[var(--color-danger-strong)]">{errors.notes?.message}</FieldMessage>
                  </Field>
                </div>
                {profileImageUrl ? (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                    Preview de imagem configurado para: {profileImageUrl}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </form>
      </div>

      {isDeleteConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <h3 className="text-lg font-semibold">Confirmar exclusao</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              Esta acao executa o soft delete da empresa. Ela deixara de aparecer nas listagens do CRM.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button leadingIcon={<X className="size-4" />} onClick={() => setIsDeleteConfirmOpen(false)} variant="outline">Cancelar</Button>
              <Button leadingIcon={<Trash2 className="size-4" />} onClick={confirmDeleteCompany} variant="danger-outline">Excluir</Button>
            </div>
          </div>
        </div>
      ) : null}

      {isSuccessModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <h3 className="text-lg font-semibold">Operacao concluida</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{successMessage}</p>
            <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">Voce sera redirecionado para a pesquisa de empresas.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
