"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  mapCategoryApiError,
  updateCategory
} from "../api/category-upsert";
import { categoryRegistrationSchema, type CategoryRegistrationSchema } from "../schema/category-registration-schema";

export function CategoryRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const categoryId = searchParams.get("id");
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEditMode && Boolean(categoryId));
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Cadastro realizado com sucesso.");
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<CategoryRegistrationSchema>(() => ({ name: "" }), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CategoryRegistrationSchema>({
    resolver: zodResolver(categoryRegistrationSchema),
    defaultValues
  });

  useEffect(() => {
    if (!isEditMode || !categoryId) return;

    let active = true;
    void getCategoryById(categoryId)
      .then((category) => {
        if (!active) return;
        reset({ name: category.name ?? "" });
      })
      .catch((error) => {
        if (!active) return;
        setFormError(mapCategoryApiError(error));
      })
      .finally(() => {
        if (active) setIsLoadingRecord(false);
      });

    return () => {
      active = false;
    };
  }, [categoryId, isEditMode, reset]);

  useEffect(() => {
    if (!isSuccessModalOpen) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/financeiro/categorias/pesquisa");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalOpen, router]);

  async function onSubmit(values: CategoryRegistrationSchema) {
    try {
      setFormError(null);

      if (isEditMode && categoryId) {
        await updateCategory(categoryId, { name: values.name.trim() });
        setSuccessMessage("Alteracao realizada com sucesso.");
      } else {
        await createCategory({ name: values.name.trim() });
        setSuccessMessage("Cadastro realizado com sucesso.");
      }

      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapCategoryApiError(error));
    }
  }

  async function confirmDelete() {
    if (!isEditMode || !categoryId) return;

    try {
      setIsDeleteConfirmOpen(false);
      setIsDeleting(true);
      setFormError(null);

      const deleted = await deleteCategory(categoryId);
      if (!deleted) {
        setFormError("Nao foi possivel excluir a categoria.");
        return;
      }

      setSuccessMessage("Categoria excluida com sucesso.");
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapCategoryApiError(error));
    } finally {
      setIsDeleting(false);
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
                disabled={isSubmitting || isLoadingRecord || isDeleting || isSuccessModalOpen}
                leadingIcon={isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                onClick={() => setIsDeleteConfirmOpen(true)}
                variant="danger-outline"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </Button>
            ) : null}
            <Button
              className="min-w-40"
              disabled={isSubmitting || isLoadingRecord || isDeleting || isSuccessModalOpen}
              onClick={() => {
                reset(defaultValues);
                setFormError(null);
              }}
              type="button"
              variant="outline"
            >
              Limpar
            </Button>
            <Button
              className="min-w-40"
              disabled={isLoadingRecord || isDeleting || isSuccessModalOpen}
              form="category-form"
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              type="submit"
            >
              Salvar
            </Button>
          </>
        }
        backAriaLabel="Voltar para pesquisa de categorias"
        backHref="/financeiro/categorias/pesquisa"
        description={isEditMode ? "Edite os dados da categoria." : "Preencha os dados para criar uma categoria."}
        title={isEditMode ? "Editar Categoria" : "Nova Categoria"}
      />

      {formError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-danger-strong)]">
          {formError}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Editar categoria" : "Cadastro de categoria"}</CardTitle>
          <CardDescription>Informe o nome da categoria.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" id="category-form" onSubmit={handleSubmit(onSubmit)}>
            {isLoadingRecord ? (
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="size-4 animate-spin" />
                Carregando categoria...
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input id="name" placeholder="Ex: Alimentacao" {...register("name")} />
              {errors.name ? <FieldMessage>{errors.name.message}</FieldMessage> : null}
            </Field>
          </form>
        </CardContent>
      </Card>

      <ConfirmationDialog
        description="Tem certeza que deseja excluir esta categoria? Esta acao nao podera ser desfeita."
        isConfirming={isDeleting}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        open={isDeleteConfirmOpen}
      />

      {isSuccessModalOpen ? (
        <div aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4" role="dialog">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 size-5 animate-spin text-[var(--color-primary)]" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-[var(--color-foreground)]">{successMessage}</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">Redirecionando para a listagem de categorias...</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
