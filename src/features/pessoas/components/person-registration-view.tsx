"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createPerson,
  deletePerson,
  getPersonById,
  mapPersonApiError,
  updatePerson,
  type PersonGender,
  type PersonMaritalStatus
} from "@/features/pessoas/api/person-upsert";
import {
  personRegistrationSchema,
  type PersonRegistrationSchema
} from "@/features/pessoas/schema/person-registration-schema";

const GENDER_OPTIONS: Array<{ value: PersonGender; label: string }> = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Feminino" },
  { value: "NON_BINARY", label: "Nao-binario" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefiro nao informar" },
  { value: "OTHER", label: "Outro" }
];

const MARITAL_STATUS_OPTIONS: Array<{ value: PersonMaritalStatus; label: string }> = [
  { value: "SINGLE", label: "Solteiro(a)" },
  { value: "MARRIED", label: "Casado(a)" },
  { value: "DIVORCED", label: "Divorciado(a)" },
  { value: "WIDOWED", label: "Viuvo(a)" },
  { value: "SEPARATED", label: "Separado(a)" },
  { value: "STABLE_UNION", label: "Uniao estavel" }
];

function toDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCpf(value: string) {
  const digits = toDigits(value).slice(0, 11);
  if (!digits) return "";

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskPhone(value: string) {
  const digits = toDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidUrl(value?: string) {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function PersonRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const personId = searchParams.get("id");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Cadastro realizado com sucesso.");
  const [isLoadingPerson, setIsLoadingPerson] = useState(false);
  const [isDeletingPerson, setIsDeletingPerson] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const initialValues = useMemo<PersonRegistrationSchema>(
    () => ({
      fullName: "",
      preferredName: "",
      documentNumber: "",
      gender: undefined,
      maritalStatus: undefined,
      nationality: "",
      email: "",
      primaryPhone: "",
      secondaryPhone: "",
      whatsAppNumber: "",
      profileImageUrl: "",
      birthDate: "",
      occupation: "",
      notes: ""
    }),
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PersonRegistrationSchema>({
    resolver: zodResolver(personRegistrationSchema),
    defaultValues: initialValues
  });

  const profileImageUrl = watch("profileImageUrl");

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

  useEffect(() => {
    if (!isEditMode || !personId) return;

    let isMounted = true;

    async function loadPerson() {
      try {
        setIsLoadingPerson(true);
        setFormError(null);

        const person = await getPersonById(personId);
        if (!isMounted) return;

        if (!person) {
          setFormError("Pessoa nao encontrada.");
          return;
        }

        reset({
          fullName: person.fullName ?? "",
          preferredName: person.preferredName ?? "",
          documentNumber: person.documentNumber ? maskCpf(person.documentNumber) : "",
          birthDate: person.birthDate ?? "",
          gender: person.gender ?? undefined,
          maritalStatus: person.maritalStatus ?? undefined,
          nationality: person.nationality ?? "",
          occupation: person.occupation ?? "",
          email: person.email ?? "",
          primaryPhone: person.primaryPhone ? maskPhone(person.primaryPhone) : "",
          secondaryPhone: person.secondaryPhone ? maskPhone(person.secondaryPhone) : "",
          whatsAppNumber: person.whatsAppNumber ? maskPhone(person.whatsAppNumber) : "",
          profileImageUrl: person.profileImageUrl ?? "",
          notes: person.notes ?? ""
        });
      } catch (error) {
        if (!isMounted) return;
        setFormError(mapPersonApiError(error));
      } finally {
        if (isMounted) {
          setIsLoadingPerson(false);
        }
      }
    }

    loadPerson();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, personId, reset]);

  useEffect(() => {
    if (isEditMode && !personId) {
      setFormError("Pessoa nao encontrada.");
    }
  }, [isEditMode, personId]);

  async function onSubmit(values: PersonRegistrationSchema) {
    try {
      setFormError(null);
      const payload = {
        fullName: values.fullName,
        preferredName: values.preferredName,
        documentNumber: values.documentNumber ? toDigits(values.documentNumber) : undefined,
        birthDate: values.birthDate,
        gender: values.gender,
        maritalStatus: values.maritalStatus,
        nationality: values.nationality,
        occupation: values.occupation,
        email: values.email,
        primaryPhone: values.primaryPhone ? toDigits(values.primaryPhone) : undefined,
        secondaryPhone: values.secondaryPhone ? toDigits(values.secondaryPhone) : undefined,
        whatsAppNumber: values.whatsAppNumber ? toDigits(values.whatsAppNumber) : undefined,
        profileImageUrl: values.profileImageUrl,
        notes: values.notes
      };

      if (isEditMode && personId) {
        await updatePerson(personId, payload);
        setSuccessMessage("Alteracao realizada com sucesso.");
      } else {
        await createPerson(payload);
        setSuccessMessage("Cadastro realizado com sucesso.");
      }

      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapPersonApiError(error));
    }
  }

  function handleClear() {
    reset();
    setFormError(null);
  }

  function handleDeletePerson() {
    setIsDeleteConfirmOpen(true);
  }

  async function confirmDeletePerson() {
    if (!personId || !isEditMode) return;

    try {
      setFormError(null);
      setIsDeletingPerson(true);
      setIsDeleteConfirmOpen(false);
      const deleted = await deletePerson(personId);
      if (!deleted) {
        setFormError("Nao foi possivel excluir a pessoa.");
        return;
      }

      setSuccessMessage("Pessoa excluida com sucesso.");
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapPersonApiError(error));
    } finally {
      setIsDeletingPerson(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">Pessoas</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isEditMode ? "Edicao de pessoa" : "Cadastro de pessoa"}
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {isEditMode
                ? "Revise e atualize os dados da pessoa selecionada."
                : "Preencha os dados principais para criar um novo cadastro de pessoa."}
            </p>
          </div>
          {isEditMode ? (
            <Button
              className="min-w-40"
              disabled={
                isSubmitting ||
                isLoadingPerson ||
                isDeletingPerson ||
                isSuccessModalOpen ||
                isDeleteConfirmOpen
              }
              leadingIcon={<Trash2 className="size-4" />}
              onClick={handleDeletePerson}
              variant="outline"
            >
              {isDeletingPerson ? "Excluindo..." : "Excluir"}
            </Button>
          ) : null}
        </div>
      </section>

      {formError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-danger-strong)]">
          {formError}
        </div>
      ) : null}

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
            {isLoadingPerson ? (
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="size-4 animate-spin" />
                Carregando dados da pessoa...
              </div>
            ) : null}

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
                <Input
                  id="documentNumber"
                  placeholder="000.000.000-00"
                  {...register("documentNumber", {
                    onChange: (event) => {
                      event.target.value = maskCpf(event.target.value);
                    }
                  })}
                />
                {errors.documentNumber ? <FieldMessage>{errors.documentNumber.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="birthDate">Data de nascimento</FieldLabel>
                <Input id="birthDate" type="date" {...register("birthDate")} />
                {errors.birthDate ? <FieldMessage>{errors.birthDate.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="gender">Sexo</FieldLabel>
                <select
                  className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                  id="gender"
                  {...register("gender", { setValueAs: (value) => value || undefined })}
                >
                  <option value="">Selecione</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.gender ? <FieldMessage>{errors.gender.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="maritalStatus">Estado civil</FieldLabel>
                <select
                  className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                  id="maritalStatus"
                  {...register("maritalStatus", { setValueAs: (value) => value || undefined })}
                >
                  <option value="">Selecione</option>
                  {MARITAL_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.maritalStatus ? <FieldMessage>{errors.maritalStatus.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="nationality">Nacionalidade</FieldLabel>
                <Input id="nationality" placeholder="Ex: Brasileira" {...register("nationality")} />
                {errors.nationality ? <FieldMessage>{errors.nationality.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" placeholder="pessoa@email.com" {...register("email")} />
                {errors.email ? <FieldMessage>{errors.email.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="primaryPhone">Telefone principal</FieldLabel>
                <Input
                  id="primaryPhone"
                  placeholder="(11) 91234-5678"
                  {...register("primaryPhone", {
                    onChange: (event) => {
                      event.target.value = maskPhone(event.target.value);
                    }
                  })}
                />
                {errors.primaryPhone ? <FieldMessage>{errors.primaryPhone.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="secondaryPhone">Telefone secundario</FieldLabel>
                <Input
                  id="secondaryPhone"
                  placeholder="(11) 3333-4444"
                  {...register("secondaryPhone", {
                    onChange: (event) => {
                      event.target.value = maskPhone(event.target.value);
                    }
                  })}
                />
                {errors.secondaryPhone ? <FieldMessage>{errors.secondaryPhone.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="whatsAppNumber">WhatsApp</FieldLabel>
                <Input
                  id="whatsAppNumber"
                  placeholder="(11) 91234-5678"
                  {...register("whatsAppNumber", {
                    onChange: (event) => {
                      event.target.value = maskPhone(event.target.value);
                    }
                  })}
                />
                {errors.whatsAppNumber ? <FieldMessage>{errors.whatsAppNumber.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="occupation">Profissao</FieldLabel>
                <Input id="occupation" placeholder="Ex: Fisioterapeuta" {...register("occupation")} />
                {errors.occupation ? <FieldMessage>{errors.occupation.message}</FieldMessage> : null}
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="profileImageUrl">URL da foto de perfil</FieldLabel>
                <Input id="profileImageUrl" placeholder="https://..." {...register("profileImageUrl")} />
                {errors.profileImageUrl ? <FieldMessage>{errors.profileImageUrl.message}</FieldMessage> : null}
              </Field>

              {isValidUrl(profileImageUrl) ? (
                <Field className="md:col-span-2">
                  <FieldLabel>Preview da foto</FieldLabel>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Preview da foto de perfil"
                      className="h-36 w-36 rounded-[var(--radius-md)] border border-[var(--color-border)] object-cover"
                      src={profileImageUrl}
                    />
                  </div>
                </Field>
              ) : null}

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
                disabled={isSuccessModalOpen || isLoadingPerson || isDeletingPerson}
                leadingIcon={<Save className="size-4" />}
                size="lg"
                type="submit"
              >
                {isSubmitting ? "Salvando..." : isEditMode ? "Salvar alteracoes" : "Salvar pessoa"}
              </Button>
              <Button
                disabled={isSuccessModalOpen || isLoadingPerson || isDeletingPerson}
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
                  {successMessage}
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Redirecionando para a listagem de pessoas...
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteConfirmOpen ? (
        <div
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="space-y-2">
              <p className="text-base font-semibold text-[var(--color-foreground)]">Confirmar exclusao</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Tem certeza que deseja excluir esta pessoa? Esta acao nao podera ser desfeita.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                disabled={isDeletingPerson}
                onClick={() => setIsDeleteConfirmOpen(false)}
                variant="ghost"
              >
                Cancelar
              </Button>
              <Button
                disabled={isDeletingPerson}
                leadingIcon={isDeletingPerson ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                onClick={confirmDeletePerson}
              >
                {isDeletingPerson ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
