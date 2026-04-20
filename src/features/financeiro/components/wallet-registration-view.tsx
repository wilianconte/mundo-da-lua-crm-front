"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { createWallet, deleteWallet, getWalletById, mapWalletApiError, updateWallet } from "../api/wallet-upsert";
import { walletRegistrationSchema, type WalletRegistrationSchema } from "../schema/wallet-registration-schema";

export function WalletRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const walletId = searchParams.get("id");
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEditMode && Boolean(walletId));
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Cadastro realizado com sucesso.");
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<WalletRegistrationSchema>(
    () => ({ name: "", initialBalance: 0, isActive: true }),
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<WalletRegistrationSchema>({
    resolver: zodResolver(walletRegistrationSchema),
    defaultValues
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (!isEditMode || !walletId) return;

    let active = true;

    void getWalletById(walletId)
      .then((wallet) => {
        if (!active) return;

        reset({
          name: wallet.name ?? "",
          initialBalance: Number(wallet.initialBalance ?? 0),
          isActive: wallet.isActive
        });
      })
      .catch((error) => {
        if (!active) return;
        setFormError(mapWalletApiError(error));
      })
      .finally(() => {
        if (active) setIsLoadingRecord(false);
      });

    return () => {
      active = false;
    };
  }, [isEditMode, walletId, reset]);

  useEffect(() => {
    if (!isSuccessModalOpen) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/financeiro/carteiras/pesquisa");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalOpen, router]);

  async function onSubmit(values: WalletRegistrationSchema) {
    try {
      setFormError(null);

      if (isEditMode && walletId) {
        await updateWallet(walletId, {
          name: values.name.trim(),
          initialBalance: Number(values.initialBalance)
        });
        setSuccessMessage("Alteracao realizada com sucesso.");
      } else {
        await createWallet({
          name: values.name.trim(),
          initialBalance: Number(values.initialBalance)
        });
        setSuccessMessage("Cadastro realizado com sucesso.");
      }

      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapWalletApiError(error));
    }
  }

  async function confirmDelete() {
    if (!isEditMode || !walletId) return;

    try {
      setIsDeleteConfirmOpen(false);
      setIsDeleting(true);
      setFormError(null);

      const deleted = await deleteWallet(walletId);
      if (!deleted) {
        setFormError("Nao foi possivel excluir a carteira.");
        return;
      }

      setSuccessMessage("Carteira excluida com sucesso.");
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapWalletApiError(error));
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
              form="wallet-form"
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              type="submit"
            >
              Salvar
            </Button>
          </>
        }
        backAriaLabel="Voltar para pesquisa de carteiras"
        backHref="/financeiro/carteiras/pesquisa"
        description={isEditMode ? "Edite os dados da carteira." : "Preencha os dados para criar uma carteira."}
        title={isEditMode ? "Editar Carteira" : "Nova Carteira"}
      />

      {formError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-danger-strong)]">
          {formError}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Editar carteira" : "Cadastro de carteira"}</CardTitle>
          <CardDescription>Informe nome, saldo inicial e status.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" id="wallet-form" onSubmit={handleSubmit(onSubmit)}>
            {isLoadingRecord ? (
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="size-4 animate-spin" />
                Carregando carteira...
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="name">Nome</FieldLabel>
                <Input id="name" placeholder="Ex: Conta Principal" {...register("name")} />
                {errors.name ? <FieldMessage>{errors.name.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="initialBalance">Saldo Inicial</FieldLabel>
                <Input id="initialBalance" step="0.01" type="number" {...register("initialBalance")} />
                {errors.initialBalance ? <FieldMessage>{errors.initialBalance.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="isActive">Status</FieldLabel>
                <div className="flex h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-3">
                  <button
                    className={`inline-flex h-7 w-12 items-center rounded-full px-1 transition ${
                      isActive ? "bg-emerald-500" : "bg-slate-300"
                    } ${isEditMode ? "cursor-not-allowed opacity-70" : ""}`}
                    disabled={isEditMode}
                    onClick={() => setValue("isActive", !isActive, { shouldDirty: true })}
                    type="button"
                  >
                    <span className={`size-5 rounded-full bg-white transition ${isActive ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                  <Badge variant={isActive ? "success" : "attention"}>{isActive ? "Ativa" : "Inativa"}</Badge>
                </div>
                {isEditMode ? (
                  <FieldMessage>O status da carteira e controlado pelo backend e nao pode ser alterado aqui.</FieldMessage>
                ) : null}
              </Field>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmationDialog
        description="Tem certeza que deseja excluir esta carteira? Esta acao nao podera ser desfeita."
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
                <p className="text-sm text-[var(--color-muted-foreground)]">Redirecionando para a listagem de carteiras...</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
