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
import { EntityAutocomplete } from "@/features/shared/components/entity-autocomplete";
import { getWallets, type WalletNode } from "../api/get-wallets";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethodById,
  mapPaymentMethodApiError,
  updatePaymentMethod
} from "../api/payment-method-upsert";
import {
  paymentMethodRegistrationSchema,
  type PaymentMethodRegistrationSchema
} from "../schema/payment-method-registration-schema";

export function PaymentMethodRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const paymentMethodId = searchParams.get("id");
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEditMode && Boolean(paymentMethodId));
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Cadastro realizado com sucesso.");
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletNode | null>(null);

  const defaultValues = useMemo<PaymentMethodRegistrationSchema>(() => ({ name: "", walletId: "" }), []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<PaymentMethodRegistrationSchema>({
    resolver: zodResolver(paymentMethodRegistrationSchema),
    defaultValues
  });

  useEffect(() => {
    if (!isEditMode || !paymentMethodId) return;

    let active = true;

    void getPaymentMethodById(paymentMethodId)
      .then(async (record) => {
        if (!active) return;

        reset({ name: record.name ?? "", walletId: record.walletId ?? "" });

        try {
          const wallets = await getWallets({ first: 1, where: { id: { eq: record.walletId } } });
          if (!active) return;
          setSelectedWallet(wallets.nodes[0] ?? null);
        } catch {
          if (!active) return;
          setSelectedWallet(null);
        }
      })
      .catch((error) => {
        if (!active) return;
        setFormError(mapPaymentMethodApiError(error));
      })
      .finally(() => {
        if (active) setIsLoadingRecord(false);
      });

    return () => {
      active = false;
    };
  }, [isEditMode, paymentMethodId, reset]);

  useEffect(() => {
    if (!isSuccessModalOpen) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/financeiro/metodos-pagamento/pesquisa");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalOpen, router]);

  async function searchWallets(input: { query: string }) {
    const response = await getWallets({
      first: 20,
      where: {
        isActive: { eq: true },
        name: { contains: input.query.trim() }
      },
      order: [{ name: "ASC" }]
    });

    return response.nodes;
  }

  async function onSubmit(values: PaymentMethodRegistrationSchema) {
    try {
      setFormError(null);

      if (isEditMode && paymentMethodId) {
        await updatePaymentMethod(paymentMethodId, { name: values.name.trim() });
        setSuccessMessage("Alteracao realizada com sucesso.");
      } else {
        await createPaymentMethod({ name: values.name.trim(), walletId: values.walletId });
        setSuccessMessage("Cadastro realizado com sucesso.");
      }

      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapPaymentMethodApiError(error));
    }
  }

  async function confirmDelete() {
    if (!isEditMode || !paymentMethodId) return;

    try {
      setIsDeleteConfirmOpen(false);
      setIsDeleting(true);
      setFormError(null);

      const deleted = await deletePaymentMethod(paymentMethodId);
      if (!deleted) {
        setFormError("Nao foi possivel excluir o metodo de pagamento.");
        return;
      }

      setSuccessMessage("Metodo de pagamento excluido com sucesso.");
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapPaymentMethodApiError(error));
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
                setSelectedWallet(null);
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
              form="payment-method-form"
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              type="submit"
            >
              Salvar
            </Button>
          </>
        }
        backAriaLabel="Voltar para pesquisa de metodos"
        backHref="/financeiro/metodos-pagamento/pesquisa"
        description={isEditMode ? "Edite os dados do metodo de pagamento." : "Preencha os dados para criar um metodo."}
        title={isEditMode ? "Editar Metodo de Pagamento" : "Novo Metodo de Pagamento"}
      />

      {formError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-danger-strong)]">
          {formError}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Editar metodo" : "Cadastro de metodo"}</CardTitle>
          <CardDescription>Informe nome e carteira vinculada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" id="payment-method-form" onSubmit={handleSubmit(onSubmit)}>
            {isLoadingRecord ? (
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="size-4 animate-spin" />
                Carregando metodo de pagamento...
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input id="name" placeholder="Ex: Cartao de Credito" {...register("name")} />
              {errors.name ? <FieldMessage>{errors.name.message}</FieldMessage> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="walletId">Carteira Vinculada</FieldLabel>
              <EntityAutocomplete
                disabled={isEditMode}
                emptyMessage="Nenhuma carteira encontrada"
                getId={(wallet) => wallet.id}
                getLabel={(wallet) => wallet.name}
                onOpenModal={() => undefined}
                onSelect={(wallet) => {
                  setSelectedWallet(wallet);
                  setValue("walletId", wallet.id, { shouldDirty: true, shouldValidate: true });
                }}
                placeholder="Pesquisar carteira"
                search={searchWallets}
                value={selectedWallet}
              />
              <input type="hidden" {...register("walletId")} />
              {errors.walletId ? <FieldMessage>{errors.walletId.message}</FieldMessage> : null}
            </Field>
          </form>
        </CardContent>
      </Card>

      <ConfirmationDialog
        description="Tem certeza que deseja excluir este metodo de pagamento? Esta acao nao podera ser desfeita."
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
                <p className="text-sm text-[var(--color-muted-foreground)]">Redirecionando para a listagem de metodos...</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
