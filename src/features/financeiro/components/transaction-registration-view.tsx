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
import { EntityAutocomplete } from "@/features/shared/components/entity-autocomplete";
import { getCategories, type CategoryNode } from "../api/get-categories";
import { getPaymentMethods, type PaymentMethodNode } from "../api/get-payment-methods";
import type { TransactionType } from "../api/get-transactions";
import { getWallets, type WalletNode } from "../api/get-wallets";
import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  mapTransactionApiError,
  updateTransaction
} from "../api/transaction-upsert";
import {
  transactionRegistrationSchema,
  type TransactionRegistrationSchema
} from "../schema/transaction-registration-schema";

const transactionTypeValues: readonly TransactionType[] = ["INCOME", "EXPENSE"];

const typeLabels: Record<TransactionType, string> = {
  INCOME: "Entrada",
  EXPENSE: "Saida"
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function TransactionRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const transactionId = searchParams.get("id");
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEditMode && Boolean(transactionId));
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Cadastro realizado com sucesso.");
  const [formError, setFormError] = useState<string | null>(null);
  const [isReconciled, setIsReconciled] = useState(false);

  const [selectedWallet, setSelectedWallet] = useState<WalletNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryNode | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodNode | null>(null);

  const defaultValues = useMemo<TransactionRegistrationSchema>(
    () => ({
      type: "EXPENSE",
      walletId: "",
      amount: 0,
      description: "",
      categoryId: "",
      paymentMethodId: "",
      transactionDate: new Date().toISOString().slice(0, 10)
    }),
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TransactionRegistrationSchema>({
    resolver: zodResolver(transactionRegistrationSchema),
    defaultValues
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (!isEditMode || !transactionId) return;

    let active = true;

    void getTransactionById(transactionId)
      .then(async (record) => {
        if (!active) return;

        setIsReconciled(record.isReconciled);

        reset({
          type: record.type,
          walletId: record.walletId,
          amount: Number(record.amount),
          description: record.description ?? "",
          categoryId: record.categoryId,
          paymentMethodId: record.paymentMethodId,
          transactionDate: toDateInput(record.transactionDate)
        });

        const [wallets, categories, methods] = await Promise.all([
          getWallets({ first: 1, where: { id: { eq: record.walletId } } }),
          getCategories({ first: 1, where: { id: { eq: record.categoryId } } }),
          getPaymentMethods({ first: 1, where: { id: { eq: record.paymentMethodId } } })
        ]);

        if (!active) return;
        setSelectedWallet(wallets.nodes[0] ?? null);
        setSelectedCategory(categories.nodes[0] ?? null);
        setSelectedPaymentMethod(methods.nodes[0] ?? null);
      })
      .catch((error) => {
        if (!active) return;
        setFormError(mapTransactionApiError(error));
      })
      .finally(() => {
        if (active) setIsLoadingRecord(false);
      });

    return () => {
      active = false;
    };
  }, [isEditMode, transactionId, reset]);

  useEffect(() => {
    if (!isSuccessModalOpen) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/financeiro/transacoes/pesquisa");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalOpen, router]);

  async function searchWallets(input: { query: string }) {
    const response = await getWallets({
      first: 20,
      where: { isActive: { eq: true }, name: { contains: input.query.trim() } },
      order: [{ name: "ASC" }]
    });
    return response.nodes;
  }

  async function searchCategories(input: { query: string }) {
    const response = await getCategories({
      first: 20,
      where: { name: { contains: input.query.trim() } },
      order: [{ name: "ASC" }]
    });
    return response.nodes;
  }

  async function searchPaymentMethods(input: { query: string }) {
    const response = await getPaymentMethods({
      first: 20,
      where: { name: { contains: input.query.trim() } },
      order: [{ name: "ASC" }]
    });
    return response.nodes;
  }

  async function onSubmit(values: TransactionRegistrationSchema) {
    try {
      setFormError(null);

      const payload = {
        amount: Number(values.amount),
        description: values.description.trim(),
        categoryId: values.categoryId,
        paymentMethodId: values.paymentMethodId,
        transactionDate: `${values.transactionDate}T12:00:00.000Z`
      };

      if (isEditMode && transactionId) {
        await updateTransaction(transactionId, payload);
        setSuccessMessage("Alteracao realizada com sucesso.");
      } else {
        await createTransaction({
          walletId: values.walletId,
          type: values.type,
          ...payload
        });
        setSuccessMessage("Cadastro realizado com sucesso.");
      }

      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapTransactionApiError(error));
    }
  }

  async function confirmDelete() {
    if (!isEditMode || !transactionId || isReconciled) return;

    try {
      setIsDeleteConfirmOpen(false);
      setIsDeleting(true);
      setFormError(null);

      const deleted = await deleteTransaction(transactionId);
      if (!deleted) {
        setFormError("Nao foi possivel excluir a transacao.");
        return;
      }

      setSuccessMessage("Transacao excluida com sucesso.");
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapTransactionApiError(error));
    } finally {
      setIsDeleting(false);
    }
  }

  const allDisabled = isReconciled || isLoadingRecord || isSubmitting || isDeleting || isSuccessModalOpen;

  return (
    <div className="space-y-6">
      <FeatureViewHeader
        actions={
          <>
            {isEditMode && !isReconciled ? (
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
              disabled={allDisabled}
              onClick={() => {
                reset(defaultValues);
                setSelectedWallet(null);
                setSelectedCategory(null);
                setSelectedPaymentMethod(null);
                setFormError(null);
              }}
              type="button"
              variant="outline"
            >
              Limpar
            </Button>
            <Button
              className="min-w-40"
              disabled={allDisabled}
              form="transaction-form"
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              type="submit"
            >
              Salvar
            </Button>
          </>
        }
        backAriaLabel="Voltar para pesquisa de transacoes"
        backHref="/financeiro/transacoes/pesquisa"
        description={isEditMode ? "Edite os dados da transacao." : "Preencha os dados para criar uma transacao."}
        title={isEditMode ? "Editar Transacao" : "Nova Transacao"}
      />

      {isReconciled ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-danger-strong)]">
          Transacao conciliada nao pode ser editada ou excluida.
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-danger-strong)]">
          {formError}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Editar transacao" : "Cadastro de transacao"}</CardTitle>
          <CardDescription>Informe os dados da transacao financeira.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" id="transaction-form" onSubmit={handleSubmit(onSubmit)}>
            {isLoadingRecord ? (
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="size-4 animate-spin" />
                Carregando transacao...
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="type">Tipo</FieldLabel>
                <select
                  className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none"
                  disabled={allDisabled || isEditMode}
                  id="type"
                  {...register("type")}
                >
                  {transactionTypeValues.map((value) => (
                    <option key={value} value={value}>
                      {typeLabels[value]}
                    </option>
                  ))}
                </select>
                {errors.type ? <FieldMessage>{errors.type.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="walletId">Carteira</FieldLabel>
                <EntityAutocomplete
                  disabled={allDisabled || isEditMode}
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

              <Field>
                <FieldLabel htmlFor="amount">Valor</FieldLabel>
                <Input disabled={allDisabled} id="amount" min="0.01" step="0.01" type="number" {...register("amount")} />
                {errors.amount ? <FieldMessage>{errors.amount.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="transactionDate">Data</FieldLabel>
                <Input disabled={allDisabled} id="transactionDate" type="date" {...register("transactionDate")} />
                {errors.transactionDate ? <FieldMessage>{errors.transactionDate.message}</FieldMessage> : null}
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="description">Descricao</FieldLabel>
                <Input disabled={allDisabled} id="description" {...register("description")} />
                {errors.description ? <FieldMessage>{errors.description.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="categoryId">Categoria</FieldLabel>
                <EntityAutocomplete
                  disabled={allDisabled}
                  emptyMessage="Nenhuma categoria encontrada"
                  getId={(category) => category.id}
                  getLabel={(category) => category.name}
                  onOpenModal={() => undefined}
                  onSelect={(category) => {
                    setSelectedCategory(category);
                    setValue("categoryId", category.id, { shouldDirty: true, shouldValidate: true });
                  }}
                  placeholder="Pesquisar categoria"
                  search={searchCategories}
                  value={selectedCategory}
                />
                <input type="hidden" {...register("categoryId")} />
                {errors.categoryId ? <FieldMessage>{errors.categoryId.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="paymentMethodId">Metodo de Pagamento</FieldLabel>
                <EntityAutocomplete
                  disabled={allDisabled}
                  emptyMessage="Nenhum metodo encontrado"
                  getId={(method) => method.id}
                  getLabel={(method) => method.name}
                  onOpenModal={() => undefined}
                  onSelect={(method) => {
                    setSelectedPaymentMethod(method);
                    setValue("paymentMethodId", method.id, { shouldDirty: true, shouldValidate: true });
                  }}
                  placeholder="Pesquisar metodo"
                  search={searchPaymentMethods}
                  value={selectedPaymentMethod}
                />
                <input type="hidden" {...register("paymentMethodId")} />
                {errors.paymentMethodId ? <FieldMessage>{errors.paymentMethodId.message}</FieldMessage> : null}
              </Field>

              {isEditMode ? (
                <Field className="md:col-span-2">
                  <FieldLabel>Tipo atual</FieldLabel>
                  <Badge variant={selectedType === "INCOME" ? "success" : "attention"}>{typeLabels[selectedType]}</Badge>
                </Field>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmationDialog
        description="Tem certeza que deseja excluir esta transacao? Esta acao nao podera ser desfeita."
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
                <p className="text-sm text-[var(--color-muted-foreground)]">Redirecionando para a listagem de transacoes...</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
