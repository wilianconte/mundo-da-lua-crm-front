"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStudentPersonById } from "@/features/alunos/api/search-student-people";
import { type MockPerson } from "@/features/alunos/api/student-mock-service";
import { PersonAutocomplete } from "@/features/alunos/components/person-autocomplete";
import { PersonSearchModal } from "@/features/alunos/components/person-search-modal";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { getUserById } from "@/features/usuarios/api/get-user-by-id";
import { createUser, mapUserApiError } from "@/features/usuarios/api/user-upsert";
import {
  userRegistrationSchema,
  type UserRegistrationSchema
} from "@/features/usuarios/schema/user-registration-schema";
import { GraphQLRequestError } from "@/lib/graphql/client";
import { cn } from "@/lib/utils/cn";

type UserTabKey = "general" | "groups";

type GroupOption = {
  id: string;
  label: string;
  description: string;
};

const tabs: Array<{ key: UserTabKey; label: string; description: string }> = [
  { key: "general", label: "Dados Gerais", description: "Informacoes principais da conta de acesso." },
  { key: "groups", label: "Grupos", description: "Controle de perfis e grupos de permissao." }
];

const groupOptions: GroupOption[] = [
  {
    id: "ADMIN",
    label: "Administrador",
    description: "Acesso amplo para administracao e configuracoes do sistema."
  },
  {
    id: "COORDINATION",
    label: "Coordenacao",
    description: "Gestao pedagogica e acompanhamento operacional."
  },
  {
    id: "SERVICE_DESK",
    label: "Atendimento",
    description: "Atendimento de leads, alunos, familias e comunicacoes."
  },
  {
    id: "FINANCIAL",
    label: "Financeiro",
    description: "Controle de cobrancas, recebimentos e fluxo financeiro."
  }
];

export function UserRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const userId = searchParams.get("id");
  const [selectedTab, setSelectedTab] = useState<UserTabKey>("general");
  const [selectedPerson, setSelectedPerson] = useState<MockPerson | null>(null);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(isEditMode && Boolean(userId));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const defaultValues = useMemo<UserRegistrationSchema>(
    () => ({
      email: "",
      password: "",
      confirmPassword: "",
      isActive: true,
      personId: "",
      groups: []
    }),
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm<UserRegistrationSchema>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues
  });

  const selectedGroups = useWatch({ control, name: "groups" }) ?? [];

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    register("personId");
  }, [register]);

  useEffect(() => {
    if (!isEditMode || !userId) return;
    const currentUserId = userId;
    let isMounted = true;

    async function loadUser() {
      try {
        setIsLoadingUser(true);
        setFormError(null);
        const user = await getUserById(currentUserId);
        if (!isMounted) return;

        if (!user) {
          setFormError("Usuario nao encontrado.");
          return;
        }

        reset({
          email: user.email ?? "",
          password: "",
          confirmPassword: "",
          isActive: user.isActive,
          personId: user.personId ?? "",
          groups: []
        });

        if (user.personId) {
          const person = await getStudentPersonById(user.personId).catch(() => null);
          if (!isMounted) return;
          setSelectedPerson(person);
          if (person?.email) {
            setValue("email", person.email, { shouldValidate: true });
          }
        } else {
          setSelectedPerson(null);
        }
      } catch (error) {
        if (!isMounted) return;
        setFormError(
          error instanceof GraphQLRequestError ? error.message : "Nao foi possivel carregar os dados do usuario."
        );
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, reset, setValue, userId]);

  useEffect(() => {
    if (!isSuccessModalOpen) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/usuarios/pesquisa");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalOpen, router]);

  useEffect(() => {
    if (isEditMode && !userId) {
      setFormError("Usuario nao encontrado.");
    }
  }, [isEditMode, userId]);

  function toggleGroup(groupId: string) {
    const alreadySelected = selectedGroups.includes(groupId);
    const nextGroups = alreadySelected
      ? selectedGroups.filter((currentGroup) => currentGroup !== groupId)
      : [...selectedGroups, groupId];

    setValue("groups", nextGroups, { shouldDirty: true, shouldValidate: true });
  }

  function handlePersonSelected(person: MockPerson) {
    setSelectedPerson(person);
    setValue("personId", person.id, { shouldValidate: true, shouldDirty: true });
    setValue("email", person.email ?? "", { shouldValidate: true, shouldDirty: true });
  }

  function handleDeleteUser() {
    setFormError("Exclusao de usuario ainda nao esta disponivel.");
  }

  async function onSubmit(values: UserRegistrationSchema) {
    try {
      setFormError(null);
      if (isEditMode) {
        setFormError("Atualizacao de usuario ainda nao esta disponivel.");
        return;
      }

      if (!selectedPerson) {
        setFormError("Selecione uma pessoa para continuar.");
        return;
      }

      const payload = {
        name: selectedPerson.fullName,
        email: values.email,
        password: values.password,
        personId: values.personId || undefined
      };

      await createUser(payload);

      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapUserApiError(error));
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
                disabled={isSubmitting || isLoadingUser || isSuccessModalOpen}
                leadingIcon={<Trash2 className="size-4" />}
                onClick={handleDeleteUser}
                type="button"
                variant="danger-outline"
              >
                Excluir
              </Button>
            ) : null}
            <Button
              className="min-w-40"
              disabled={isSubmitting || isLoadingUser || isSuccessModalOpen}
              form="user-form"
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              type="submit"
            >
              {isEditMode ? "Atualizar" : "Salvar"}
            </Button>
          </>
        }
        backAriaLabel="Voltar para pesquisa de usuarios"
        backHref="/usuarios/pesquisa"
        description="Cadastro de conta de acesso com organizacao por dados gerais e grupos de permissao."
        title={<span className="text-xl">{isEditMode ? "Editar usuario" : "Novo usuario"}</span>}
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

        <form className="space-y-6" id="user-form" onSubmit={handleSubmit(onSubmit)}>
          {isLoadingUser ? (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="size-4 animate-spin" /> Carregando dados do usuario...
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "general" ? (
            <Card>
              <CardHeader>
                <CardTitle>Dados Gerais</CardTitle>
              <CardDescription>Informacoes principais para identificacao e acesso do usuario.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field className="md:col-span-2">
                  <FieldLabel>Pessoa</FieldLabel>
                  <PersonAutocomplete
                    label="Pessoa"
                    onCreateNew={() => router.push("/pessoas/cadastro")}
                    onOpenModal={() => setIsPersonModalOpen(true)}
                    onSelect={handlePersonSelected}
                    value={selectedPerson}
                  />
                  {errors.personId ? <FieldMessage>{errors.personId.message}</FieldMessage> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="user-email">Email</FieldLabel>
                  <Input
                    aria-readonly="true"
                    className="cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted-foreground)] focus:border-[var(--color-border)] focus:ring-0"
                    id="user-email"
                    placeholder="Selecione uma pessoa para preencher o email"
                    readOnly
                    {...register("email")}
                  />
                  {errors.email ? <FieldMessage>{errors.email.message}</FieldMessage> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="user-cpf">CPF</FieldLabel>
                  <Input
                    aria-readonly="true"
                    className="cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted-foreground)] focus:border-[var(--color-border)] focus:ring-0"
                    id="user-cpf"
                    placeholder="Selecione uma pessoa para preencher o CPF"
                    readOnly
                    value={selectedPerson?.documentNumber ?? ""}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="user-password">Senha</FieldLabel>
                  <Input id="user-password" type="password" {...register("password")} />
                  {errors.password ? <FieldMessage>{errors.password.message}</FieldMessage> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="user-confirm-password">Confirmacao de senha</FieldLabel>
                  <Input id="user-confirm-password" type="password" {...register("confirmPassword")} />
                  {errors.confirmPassword ? <FieldMessage>{errors.confirmPassword.message}</FieldMessage> : null}
                </Field>

                <Field className="md:col-span-2">
                  <label
                    className="inline-flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)]"
                    htmlFor="user-is-active"
                  >
                    <input
                      className="size-4 accent-[var(--color-primary)]"
                      id="user-is-active"
                      type="checkbox"
                      {...register("isActive")}
                    />
                    Ativo
                  </label>
                </Field>

              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "groups" ? (
            <Card>
              <CardHeader>
                <CardTitle>Grupos</CardTitle>
                <CardDescription>Selecione os grupos que definem as permissoes desta conta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupOptions.map((group) => {
                  const checked = selectedGroups.includes(group.id);
                  return (
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border p-4 transition",
                        checked
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                          : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                      )}
                      key={group.id}
                    >
                      <input
                        checked={checked}
                        className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                        onChange={() => toggleGroup(group.id)}
                        type="checkbox"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">{group.label}</p>
                        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{group.description}</p>
                      </div>
                    </label>
                  );
                })}
                {errors.groups ? <FieldMessage>{errors.groups.message}</FieldMessage> : null}
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
                <p className="text-base font-semibold text-[var(--color-foreground)]">
                  {isEditMode ? "Usuario atualizado com sucesso." : "Usuario cadastrado com sucesso."}
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Redirecionando para a listagem de usuarios...
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <PersonSearchModal
        onClose={() => setIsPersonModalOpen(false)}
        onSelect={handlePersonSelected}
        open={isPersonModalOpen}
      />
    </div>
  );
}

