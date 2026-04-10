"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Lock, Mail, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerTenant } from "@/features/auth/api/register-tenant";
import { type SignUpSchema, signUpSchema } from "@/features/auth/schema/sign-up-schema";
import { type GraphQLRequestError } from "@/lib/graphql/client";
import { cn } from "@/lib/utils/cn";

type WizardStep = {
  id: string;
  label: string;
  description: string;
  fields: Array<keyof SignUpSchema>;
};

function formatPhoneBr(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const COMPANY_TYPE_OPTIONS: Array<{ value: NonNullable<SignUpSchema["companyType"]>; label: string }> = [
  { value: "SUPPLIER", label: "Fornecedor" },
  { value: "PARTNER", label: "Parceiro" },
  { value: "SCHOOL", label: "Escola" },
  { value: "CORPORATE_CUSTOMER", label: "Cliente corporativo" },
  { value: "BILLING_ACCOUNT", label: "Conta de faturamento" },
  { value: "SERVICE_PROVIDER", label: "Prestador de servico" },
  { value: "SPONSOR", label: "Patrocinador" },
  { value: "OTHER", label: "Outro" }
];

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "person",
    label: "Pessoa",
    description: "Dados do responsavel principal da conta.",
    fields: ["fullName", "documentNumber", "birthDate", "personEmail", "personPhone"]
  },
  {
    id: "company",
    label: "Empresa",
    description: "Informacoes da empresa vinculada ao acesso.",
    fields: ["legalName", "tradeName", "registrationNumber", "companyEmail", "companyPhone", "companyType"]
  },
  {
    id: "access",
    label: "Acesso",
    description: "Defina as credenciais para login.",
    fields: ["password", "confirmPassword"]
  }
];

type SignUpFormProps = {
  hideHeader?: boolean;
};

export function SignUpForm({ hideHeader = false }: SignUpFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    trigger,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      documentNumber: "",
      birthDate: "",
      personEmail: "",
      personPhone: "",
      legalName: "",
      tradeName: "",
      registrationNumber: "",
      companyEmail: "",
      companyPhone: "",
      companyType: undefined,
      password: "",
      confirmPassword: ""
    }
  });

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const current = WIZARD_STEPS[currentStep];
  const personPhoneValue = watch("personPhone") ?? "";
  const companyPhoneValue = watch("companyPhone") ?? "";

  async function onSubmit(values: SignUpSchema) {
    try {
      setSuccessMessage(null);
      await registerTenant({
        companyLegalName: values.legalName,
        companyCnpj: values.registrationNumber,
        companyEmail: values.companyEmail,
        companyPhone: values.companyPhone,
        adminName: values.fullName,
        adminEmail: values.personEmail.trim().toLowerCase(),
        adminCpf: values.documentNumber,
        adminPhone: values.personPhone,
        password: values.password,
        passwordConfirmation: values.confirmPassword
      });

      setSuccessMessage(
        "Conta criada com sucesso. Faça login para acessar sua nova organizacao."
      );
    } catch (error) {
      const code = (error as GraphQLRequestError).code;
      const messageByCode: Record<string, string> = {
        VALIDATION_ERROR: "Campos invalidos. Revise os dados e tente novamente.",
        INVALID_CREDENTIALS: "Nao foi possivel concluir o cadastro com as credenciais informadas."
      };

      setError("root", {
        message: messageByCode[code ?? ""] ?? "Nao foi possivel concluir o cadastro agora. Tente novamente."
      });
    }
  }

  async function handleNextStep() {
    const stepIsValid = await trigger(current.fields, { shouldFocus: true });
    if (!stepIsValid) {
      return;
    }

    setCurrentStep((previous) => Math.min(previous + 1, WIZARD_STEPS.length - 1));
  }

  function handlePreviousStep() {
    setCurrentStep((previous) => Math.max(previous - 1, 0));
  }

  return (
    <div className="w-full">
      {!hideHeader ? (
        <header className="space-y-1.5 text-center">
          <h2 className="flex items-center justify-center gap-2 text-3xl font-bold tracking-tight text-[#0a2f68] md:text-4xl">
            <UserRoundPlus className="size-7" />
            Criar conta
          </h2>
          <p className="text-sm text-slate-600 md:text-base">Complete as etapas para solicitar seu acesso.</p>
        </header>
      ) : null}

      {!hideHeader ? <div className="mt-4 h-px w-full bg-slate-200" /> : null}

      <div className={cn("relative", hideHeader ? "mt-0" : "mt-4")}>
        <div aria-hidden="true" className="absolute left-[8%] right-[8%] top-5 h-px bg-slate-200" />
        <ol aria-label="Etapas do cadastro" className="relative z-10 flex items-start justify-between gap-3">
          {WIZARD_STEPS.map((step, index) => {
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <li className="flex flex-1 flex-col items-center gap-2 text-center" key={step.id}>
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border text-sm font-bold",
                    isCurrent
                      ? "border-[#0a2f68] bg-[#0a2f68] text-white"
                      : isComplete
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white text-slate-500"
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.08em]",
                    isCurrent ? "text-[#0a2f68]" : isComplete ? "text-emerald-700" : "text-slate-500"
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <form className="mt-6 w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-700">{current.label}</h3>
          <p className="text-sm text-slate-500">{current.description}</p>
        </div>

        {current.id === "person" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Field className="md:col-span-2">
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-full-name"
                >
                  Nome completo <span className="text-[#c81e1e]">*</span>
                </FieldLabel>
              <Input className="h-12 rounded-none border-slate-300 bg-[#eef1f5]" id="signup-full-name" {...register("fullName")} />
              <FieldMessage className={cn("min-h-5 text-red-600", !errors.fullName && "invisible")}>
                {errors.fullName?.message ?? "."}
              </FieldMessage>
            </Field>

              <Field>
                <FieldLabel className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600" htmlFor="signup-document">
                  CPF <span className="text-[#c81e1e]">*</span>
                </FieldLabel>
                <Input
                  className="h-12 rounded-none border-slate-300 bg-[#eef1f5]"
                  id="signup-document"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  {...register("documentNumber")}
                />
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.documentNumber && "invisible")}>
                  {errors.documentNumber?.message ?? "."}
                </FieldMessage>
              </Field>

              <Field>
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-birth-date"
                >
                  Data de nascimento
                </FieldLabel>
                <Input
                  className="h-12 rounded-none border-slate-300 bg-[#eef1f5]"
                  id="signup-birth-date"
                  type="date"
                  {...register("birthDate")}
                />
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.birthDate && "invisible")}>
                  {errors.birthDate?.message ?? "."}
                </FieldMessage>
              </Field>

              <Field>
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-person-email"
                >
                  E-mail <span className="text-[#c81e1e]">*</span>
                </FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    autoComplete="email"
                    className="h-12 rounded-none border-slate-300 bg-[#eef1f5] pl-10"
                    id="signup-person-email"
                    type="email"
                    {...register("personEmail")}
                  />
                </div>
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.personEmail && "invisible")}>
                  {errors.personEmail?.message ?? "."}
                </FieldMessage>
              </Field>

              <Field>
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-person-phone"
                >
                  Telefone
                </FieldLabel>
                <Input
                  className="h-12 rounded-none border-slate-300 bg-[#eef1f5]"
                  id="signup-person-phone"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  {...register("personPhone")}
                  value={personPhoneValue}
                  onChange={(event) => {
                    setValue("personPhone", formatPhoneBr(event.target.value), {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                  }}
                />
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.personPhone && "invisible")}>
                  {errors.personPhone?.message ?? "."}
                </FieldMessage>
              </Field>
          </div>
        ) : null}

        {current.id === "company" ? (
          <div className="grid gap-3 md:grid-cols-2">
              <Field className="md:col-span-2">
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-legal-name"
                >
                  Razao social <span className="text-[#c81e1e]">*</span>
                </FieldLabel>
                <Input className="h-12 rounded-none border-slate-300 bg-[#eef1f5]" id="signup-legal-name" {...register("legalName")} />
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.legalName && "invisible")}>
                  {errors.legalName?.message ?? "."}
                </FieldMessage>
              </Field>

              <Field>
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-trade-name"
                >
                  Nome fantasia
                </FieldLabel>
                <Input className="h-12 rounded-none border-slate-300 bg-[#eef1f5]" id="signup-trade-name" {...register("tradeName")} />
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.tradeName && "invisible")}>
                  {errors.tradeName?.message ?? "."}
                </FieldMessage>
              </Field>

              <Field>
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-registration-number"
                >
                  CNPJ
                </FieldLabel>
                <Input
                  className="h-12 rounded-none border-slate-300 bg-[#eef1f5]"
                  id="signup-registration-number"
                  {...register("registrationNumber")}
                />
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.registrationNumber && "invisible")}>
                  {errors.registrationNumber?.message ?? "."}
                </FieldMessage>
              </Field>

              <Field>
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-company-email"
                >
                  E-mail da empresa
                </FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    className="h-12 rounded-none border-slate-300 bg-[#eef1f5] pl-10"
                    id="signup-company-email"
                    type="email"
                    {...register("companyEmail")}
                  />
                </div>
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.companyEmail && "invisible")}>
                  {errors.companyEmail?.message ?? "."}
                </FieldMessage>
              </Field>

              <Field>
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-company-phone"
                >
                  Telefone da empresa
                </FieldLabel>
                <Input
                  className="h-12 rounded-none border-slate-300 bg-[#eef1f5]"
                  id="signup-company-phone"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  {...register("companyPhone")}
                  value={companyPhoneValue}
                  onChange={(event) => {
                    setValue("companyPhone", formatPhoneBr(event.target.value), {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                  }}
                />
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.companyPhone && "invisible")}>
                  {errors.companyPhone?.message ?? "."}
                </FieldMessage>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-company-type"
                >
                  Tipo de empresa
                </FieldLabel>
                <select
                  className="flex h-12 w-full rounded-none border border-slate-300 bg-[#eef1f5] px-3 py-2 text-sm outline-none transition focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]"
                  id="signup-company-type"
                  {...register("companyType")}
                >
                  <option value="">Selecione</option>
                  {COMPANY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.companyType && "invisible")}>
                  {errors.companyType?.message ?? "."}
                </FieldMessage>
              </Field>
          </div>
        ) : null}

        {current.id === "access" ? (
          <div className="grid gap-3 md:grid-cols-2">
              <Field>
                <FieldLabel className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600" htmlFor="signup-password">
                  Senha <span className="text-[#c81e1e]">*</span>
                </FieldLabel>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    autoComplete="new-password"
                    className="h-12 rounded-none border-slate-300 bg-[#eef1f5] pl-10"
                    id="signup-password"
                    type="password"
                    {...register("password")}
                  />
                </div>
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.password && "invisible")}>
                  {errors.password?.message ?? "."}
                </FieldMessage>
              </Field>

              <Field>
                <FieldLabel
                  className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
                  htmlFor="signup-confirm-password"
                >
                  Confirmar senha <span className="text-[#c81e1e]">*</span>
                </FieldLabel>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    autoComplete="new-password"
                    className="h-12 rounded-none border-slate-300 bg-[#eef1f5] pl-10"
                    id="signup-confirm-password"
                    type="password"
                    {...register("confirmPassword")}
                  />
                </div>
                <FieldMessage className={cn("min-h-5 text-red-600", !errors.confirmPassword && "invisible")}>
                  {errors.confirmPassword?.message ?? "."}
                </FieldMessage>
              </Field>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          {isFirstStep ? (
            <Link
              aria-label="Voltar para login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition duration-200 hover:text-[#0a2f68]"
              href="/login"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-full border border-slate-300 hover:bg-slate-100">
                <ArrowLeft className="size-4" />
              </span>
              <span>Voltar</span>
            </Link>
          ) : (
            <Button
              aria-label="Voltar etapa"
              className="h-auto gap-2 border-none bg-transparent p-0 text-sm font-semibold text-slate-700 shadow-none hover:bg-transparent hover:text-[#0a2f68]"
              disabled={isSubmitting}
              onClick={handlePreviousStep}
              type="button"
              variant="ghost"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-full border border-slate-300 hover:bg-slate-100">
                <ArrowLeft className="size-4" />
              </span>
              <span>Voltar</span>
            </Button>
          )}

          {isLastStep ? (
            <Button
              aria-label="Proximo"
              className="h-auto gap-2 border-none bg-transparent p-0 text-sm font-semibold text-slate-700 shadow-none hover:bg-transparent hover:text-[#0a2f68]"
              disabled={isSubmitting}
              type="submit"
            >
              <span>Próximo</span>
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#0a2f68] text-white hover:bg-[#09306f]">
                <ArrowRight className="size-4" />
              </span>
            </Button>
          ) : (
            <Button
              aria-label="Proximo"
              className="h-auto gap-2 border-none bg-transparent p-0 text-sm font-semibold text-slate-700 shadow-none hover:bg-transparent hover:text-[#0a2f68]"
              onClick={handleNextStep}
              type="button"
            >
              <span>Próximo</span>
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#0a2f68] text-white hover:bg-[#09306f]">
                <ArrowRight className="size-4" />
              </span>
            </Button>
          )}
        </div>

        <Link
          className="flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-sm font-semibold text-[#0a2f68] hover:text-[#061d41]"
          href="/login"
        >
          <ArrowLeft className="size-4" />
          Voltar para login
        </Link>

        {errors.root?.message ? <FieldMessage>{errors.root.message}</FieldMessage> : null}
        {successMessage ? <FieldMessage className="text-emerald-700">{successMessage}</FieldMessage> : null}
      </form>
    </div>
  );
}
