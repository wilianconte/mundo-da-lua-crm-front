"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import {
  createRole,
  deleteRole,
  getPermissions,
  getRoleById,
  mapRoleApiError,
  updateRole,
  updateRolePermissions,
  type PermissionRecord
} from "@/features/grupos/api/role-upsert";
import {
  groupRegistrationSchema,
  type GroupRegistrationSchema
} from "@/features/grupos/schema/group-registration-schema";

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function GroupRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const roleId = searchParams.get("id");
  const [isLoadingRole, setIsLoadingRole] = useState(isEditMode && Boolean(roleId));
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("Grupo cadastrado com sucesso.");
  const [availablePermissions, setAvailablePermissions] = useState<PermissionRecord[]>([]);

  const defaultValues = useMemo<GroupRegistrationSchema>(
    () => ({
      name: "",
      description: "",
      isActive: true,
      permissionIds: []
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
  } = useForm<GroupRegistrationSchema>({
    resolver: zodResolver(groupRegistrationSchema),
    defaultValues
  });
  const selectedPermissionIds = useWatch({ control, name: "permissionIds" }) ?? [];
  const groupedPermissions = useMemo(() => {
    return availablePermissions.reduce<Record<string, PermissionRecord[]>>((accumulator, permission) => {
      const groupName = permission.group || "Outros";
      if (!accumulator[groupName]) {
        accumulator[groupName] = [];
      }

      accumulator[groupName].push(permission);
      return accumulator;
    }, {});
  }, [availablePermissions]);

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    let isMounted = true;

    async function loadPermissions() {
      try {
        setIsLoadingPermissions(true);
        setPermissionsError(null);
        const permissions = await getPermissions();
        if (!isMounted) return;

        const activePermissions = permissions
          .filter((permission) => permission.isActive)
          .sort((a, b) => {
            if (a.group === b.group) {
              return a.name.localeCompare(b.name);
            }

            return a.group.localeCompare(b.group);
          });

        setAvailablePermissions(activePermissions);
      } catch (error) {
        if (!isMounted) return;
        setPermissionsError(mapRoleApiError(error));
      } finally {
        if (isMounted) {
          setIsLoadingPermissions(false);
        }
      }
    }

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode || !roleId) return;

    let isMounted = true;

    async function loadRole() {
      try {
        setIsLoadingRole(true);
        setFormError(null);

        const role = await getRoleById(roleId);
        if (!isMounted) return;

        if (!role) {
          setFormError("Grupo nao encontrado.");
          return;
        }

        reset({
          name: role.name ?? "",
          description: role.description ?? "",
          isActive: role.isActive,
          permissionIds: role.permissions?.filter((permission) => permission.isActive).map((permission) => permission.id) ?? []
        });
      } catch (error) {
        if (!isMounted) return;
        setFormError(mapRoleApiError(error));
      } finally {
        if (isMounted) {
          setIsLoadingRole(false);
        }
      }
    }

    loadRole();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, reset, roleId]);

  useEffect(() => {
    if (!isSuccessModalOpen) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/grupos/pesquisa");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalOpen, router]);

  useEffect(() => {
    if (isEditMode && !roleId) {
      setFormError("Grupo nao encontrado.");
    }
  }, [isEditMode, roleId]);

  function togglePermission(permissionId: string) {
    const alreadySelected = selectedPermissionIds.includes(permissionId);
    const nextPermissionIds = alreadySelected
      ? selectedPermissionIds.filter((currentPermissionId) => currentPermissionId !== permissionId)
      : [...selectedPermissionIds, permissionId];

    setValue("permissionIds", nextPermissionIds, { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit(values: GroupRegistrationSchema) {
    try {
      setFormError(null);

      if (isEditMode && roleId) {
        const updatedRole = await updateRole(roleId, {
          name: values.name,
          description: normalizeOptional(values.description),
          isActive: values.isActive
        });
        await updateRolePermissions(updatedRole.id, values.permissionIds);

        setSuccessMessage("Grupo atualizado com sucesso.");
      } else {
        const createdRole = await createRole({
          name: values.name,
          description: normalizeOptional(values.description)
        });
        await updateRolePermissions(createdRole.id, values.permissionIds);

        setSuccessMessage("Grupo cadastrado com sucesso.");
      }

      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapRoleApiError(error));
    }
  }

  function handleDeleteRole() {
    setIsDeleteConfirmOpen(true);
  }

  async function confirmDeleteRole() {
    if (!roleId || !isEditMode) return;

    try {
      setFormError(null);
      setIsDeletingRole(true);
      setIsDeleteConfirmOpen(false);

      const deleted = await deleteRole(roleId);
      if (!deleted) {
        setFormError("Nao foi possivel excluir o grupo.");
        return;
      }

      setSuccessMessage("Grupo excluido com sucesso.");
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapRoleApiError(error));
    } finally {
      setIsDeletingRole(false);
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
                disabled={isSubmitting || isLoadingRole || isDeletingRole || isSuccessModalOpen || isDeleteConfirmOpen}
                leadingIcon={isDeletingRole ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                onClick={handleDeleteRole}
                type="button"
                variant="danger-outline"
              >
                {isDeletingRole ? "Excluindo..." : "Excluir"}
              </Button>
            ) : null}
            <Button
              className="min-w-40"
              disabled={isSubmitting || isLoadingRole || isDeletingRole || isSuccessModalOpen || isDeleteConfirmOpen}
              form="group-form"
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              type="submit"
            >
              {isEditMode ? "Atualizar" : "Salvar"}
            </Button>
          </>
        }
        backAriaLabel="Voltar para pesquisa de grupos"
        backHref="/grupos/pesquisa"
        description="Cadastro de grupos de acesso para organizacao de permissoes."
        title={<span className="text-xl">{isEditMode ? "Editar grupo" : "Novo grupo"}</span>}
      />

      {formError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-red-700">{formError}</p>
          </CardContent>
        </Card>
      ) : null}

      <form className="space-y-6" id="group-form" onSubmit={handleSubmit(onSubmit)}>
        {isLoadingRole ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-[var(--color-muted-foreground)]">
              <Loader2 className="size-4 animate-spin" /> Carregando dados do grupo...
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Dados Gerais</CardTitle>
            <CardDescription>Informacoes principais para identificacao do grupo de acesso.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="group-name">Nome</FieldLabel>
              <Input id="group-name" maxLength={150} {...register("name")} />
              {errors.name ? <FieldMessage>{errors.name.message}</FieldMessage> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="group-description">Descricao</FieldLabel>
              <textarea
                className="min-h-28 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                id="group-description"
                maxLength={500}
                placeholder="Descreva o escopo de permissao deste grupo"
                {...register("description")}
              />
              {errors.description ? <FieldMessage>{errors.description.message}</FieldMessage> : null}
            </Field>

            {isEditMode ? (
              <Field>
                <label
                  className="inline-flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)]"
                  htmlFor="group-is-active"
                >
                  <input
                    className="size-4 accent-[var(--color-primary)]"
                    id="group-is-active"
                    type="checkbox"
                    {...register("isActive")}
                  />
                  Ativo
                </label>
              </Field>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissoes</CardTitle>
            <CardDescription>
              Selecione as permissoes que esse grupo podera executar no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingPermissions ? (
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="size-4 animate-spin" />
                Carregando permissoes...
              </div>
            ) : null}

            {!isLoadingPermissions && permissionsError ? (
              <p className="text-sm font-medium text-[var(--color-danger-strong)]">{permissionsError}</p>
            ) : null}

            {!isLoadingPermissions && !permissionsError && !availablePermissions.length ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">Nenhuma permissao ativa encontrada.</p>
            ) : null}

            {!isLoadingPermissions && !permissionsError && availablePermissions.length
              ? Object.entries(groupedPermissions).map(([groupName, permissions]) => (
                <div className="space-y-3" key={groupName}>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
                    {groupName}
                  </p>
                  <div className="space-y-2">
                    {permissions.map((permission) => {
                      const checked = selectedPermissionIds.includes(permission.id);

                      return (
                        <label
                          className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 hover:bg-[var(--color-surface-muted)]"
                          key={permission.id}
                        >
                          <input
                            checked={checked}
                            className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                            onChange={() => togglePermission(permission.id)}
                            type="checkbox"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-foreground)]">{permission.name}</p>
                            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                              {permission.description || "Sem descricao"}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))
              : null}

            {errors.permissionIds ? <FieldMessage>{errors.permissionIds.message}</FieldMessage> : null}
          </CardContent>
        </Card>
      </form>

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
                <p className="text-sm text-[var(--color-muted-foreground)]">Redirecionando para a listagem de grupos...</p>
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
                Tem certeza que deseja excluir este grupo? Esta acao nao podera ser desfeita.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                disabled={isDeletingRole}
                leadingIcon={<X className="size-4" />}
                onClick={() => setIsDeleteConfirmOpen(false)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                disabled={isDeletingRole}
                leadingIcon={isDeletingRole ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                onClick={confirmDeleteRole}
                variant="danger-outline"
              >
                {isDeletingRole ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
