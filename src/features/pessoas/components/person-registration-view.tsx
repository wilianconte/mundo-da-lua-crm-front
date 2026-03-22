"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  personRegistrationSchema,
  type PersonRegistrationSchema
} from "@/features/pessoas/schema/person-registration-schema";

export function PersonRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const queryFullName = searchParams.get("fullName") ?? "";
  const queryDocumentNumber = searchParams.get("documentNumber") ?? "";
  const queryPrimaryPhone = searchParams.get("primaryPhone") ?? "";
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const initialValues = useMemo<PersonRegistrationSchema>(
    () => ({
      fullName: queryFullName,
      preferredName: "",
      documentNumber: queryDocumentNumber,
      email: "",
      primaryPhone: queryPrimaryPhone,
      whatsAppNumber: "",
      birthDate: "",
      occupation: "",
      notes: ""
    }),
    [queryDocumentNumber, queryFullName, queryPrimaryPhone]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PersonRegistrationSchema>({
    resolver: zodResolver(personRegistrationSchema),
    defaultValues: initialValues
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    if (!isSuccessModalOpen) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/pessoas/pesquisa");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalOpen, router]);

  async function onSubmit(values: PersonRegistrationSchema) {
    console.log("Nova pessoa:", values);
    setIsSuccessModalOpen(true);
  }

  function handleClear() {
    reset();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">Pessoas</p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {isEditMode ? "Edicao de pessoa" : "Cadastro de pessoa"}
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {isEditMode
            ? "Revise e atualize os dados da pessoa selecionada."
            : "Preencha os dados principais para criar um novo cadastro de pessoa."}
        </p>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{isEditMode ? "Editar cadastro" : "Novo cadastro"}</CardTitle>
              <CardDescription>
                {isEditMode
                  ? "Atualize as informacoes de identificacao e contato da pessoa."
                  : "Informacoes de identificacao e contato da pessoa."}
              </CardDescription>
            </div>
            <Badge variant="attention">Obrigatorio</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fullName">Nome completo</FieldLabel>
                <Input id="fullName" placeholder="Ex: Ana Paula Souza" {...register("fullName")} />
                {errors.fullName ? <FieldMessage>{errors.fullName.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="preferredName">Nome social/apelido</FieldLabel>
                <Input id="preferredName" placeholder="Ex: Ana" {...register("preferredName")} />
                {errors.preferredName ? <FieldMessage>{errors.preferredName.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="documentNumber">CPF/CNPJ</FieldLabel>
                <Input id="documentNumber" placeholder="000.000.000-00" {...register("documentNumber")} />
                {errors.documentNumber ? <FieldMessage>{errors.documentNumber.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" placeholder="pessoa@email.com" {...register("email")} />
                {errors.email ? <FieldMessage>{errors.email.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="primaryPhone">Telefone principal</FieldLabel>
                <Input id="primaryPhone" placeholder="(11) 91234-5678" {...register("primaryPhone")} />
                {errors.primaryPhone ? <FieldMessage>{errors.primaryPhone.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="whatsAppNumber">WhatsApp</FieldLabel>
                <Input id="whatsAppNumber" placeholder="(11) 91234-5678" {...register("whatsAppNumber")} />
                {errors.whatsAppNumber ? <FieldMessage>{errors.whatsAppNumber.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="birthDate">Data de nascimento</FieldLabel>
                <Input id="birthDate" type="date" {...register("birthDate")} />
                {errors.birthDate ? <FieldMessage>{errors.birthDate.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="occupation">Profissao</FieldLabel>
                <Input id="occupation" placeholder="Ex: Fisioterapeuta" {...register("occupation")} />
                {errors.occupation ? <FieldMessage>{errors.occupation.message}</FieldMessage> : null}
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="notes">Observacoes</FieldLabel>
                <textarea
                  className="min-h-28 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                  id="notes"
                  placeholder="Informacoes adicionais relevantes sobre a pessoa"
                  {...register("notes")}
                />
                {errors.notes ? <FieldMessage>{errors.notes.message}</FieldMessage> : null}
              </Field>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isSuccessModalOpen}
                leadingIcon={<Save className="size-4" />}
                size="lg"
                type="submit"
              >
                {isSubmitting ? "Salvando..." : isEditMode ? "Salvar alteracoes" : "Salvar pessoa"}
              </Button>
              <Button
                disabled={isSuccessModalOpen}
                leadingIcon={<UserPlus className="size-4" />}
                onClick={handleClear}
                size="lg"
                type="button"
                variant="outline"
              >
                Limpar formulario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isSuccessModalOpen ? (
        <div
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 size-5 animate-spin text-[var(--color-primary)]" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-[var(--color-foreground)]">
                  {isEditMode ? "Alteracao realizada com sucesso." : "Cadastro realizado com sucesso."}
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Redirecionando para a listagem de pessoas...
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
