"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { EntityAutocomplete } from "@/features/shared/components/entity-autocomplete";
import { getCategories, type CategoryNode } from "../api/get-categories";
import { getPaymentMethods, type PaymentMethodNode } from "../api/get-payment-methods";
import { getWallets, type WalletNode } from "../api/get-wallets";
import { createTransfer, mapTransferApiError } from "../api/transfer";
import { transferRegistrationSchema, type TransferRegistrationSchema } from "../schema/transfer-registration-schema";

export function TransferRegistrationView() {
  const router = useRouter();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [fromWallet, setFromWallet] = useState<WalletNode | null>(null);
  const [toWallet, setToWallet] = useState<WalletNode | null>(null);
  const [category, setCategory] = useState<CategoryNode | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodNode | null>(null);

  const defaultValues = useMemo<TransferRegistrationSchema>(
    () => ({
      fromWalletId: "",
      toWalletId: "",
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
    formState: { errors, isSubmitting }
  } = useForm<TransferRegistrationSchema>({
    resolver: zodResolver(transferRegistrationSchema),
    defaultValues
  });

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

  async function onSubmit(values: TransferRegistrationSchema) {
    try {
      setFormError(null);

      await createTransfer({
        fromWalletId: values.fromWalletId,
        toWalletId: values.toWalletId,
        amount: Number(values.amount),
        description: values.description.trim(),
        categoryId: values.categoryId,
        paymentMethodId: values.paymentMethodId,
        transactionDate: `${values.transactionDate}T12:00:00.000Z`
      });

      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapTransferApiError(error));
    }
  }

  return (
    <div className="space-y-6">
      <FeatureViewHeader
        actions={
          <>
            <Button
              className="min-w-40"
              disabled={isSubmitting || isSuccessModalOpen}
              onClick={() => {
                reset(defaultValues);
                setFromWallet(null);
                setToWallet(null);
                setCategory(null);
                setPaymentMethod(null);
                setFormError(null);
              }}
              type="button"
              variant="outline"
            >
              Limpar
            </Button>
            <Button
              className="min-w-40"
              disabled={isSuccessModalOpen}
              form="transfer-form"
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Repeat className="size-4" />}
              type="submit"
            >
              Transferir
            </Button>
          </>
        }
        backAriaLabel="Voltar para financeiro"
        backHref="/financeiro"
        description="Transfira valores entre carteiras do mesmo tenant"
        title="Nova Transferencia"
      />

      {formError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-danger-strong)]">
          {formError}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Cadastro de transferencia</CardTitle>
          <CardDescription>Informe os dados para transferir entre carteiras.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" id="transfer-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fromWalletId">Carteira Origem</FieldLabel>
                <EntityAutocomplete
                  emptyMessage="Nenhuma carteira encontrada"
                  getId={(wallet) => wallet.id}
                  getLabel={(wallet) => wallet.name}
                  onOpenModal={() => undefined}
                  onSelect={(wallet) => {
                    setFromWallet(wallet);
                    setValue("fromWalletId", wallet.id, { shouldDirty: true, shouldValidate: true });
                  }}
                  placeholder="Pesquisar carteira origem"
                  search={searchWallets}
                  value={fromWallet}
                />
                <input type="hidden" {...register("fromWalletId")} />
                {errors.fromWalletId ? <FieldMessage>{errors.fromWalletId.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="toWalletId">Carteira Destino</FieldLabel>
                <EntityAutocomplete
                  emptyMessage="Nenhuma carteira encontrada"
                  excludedIds={fromWallet ? [fromWallet.id] : []}
                  getId={(wallet) => wallet.id}
                  getLabel={(wallet) => wallet.name}
                  onOpenModal={() => undefined}
                  onSelect={(wallet) => {
                    setToWallet(wallet);
                    setValue("toWalletId", wallet.id, { shouldDirty: true, shouldValidate: true });
                  }}
                  placeholder="Pesquisar carteira destino"
                  search={searchWallets}
                  value={toWallet}
                />
                <input type="hidden" {...register("toWalletId")} />
                {errors.toWalletId ? <FieldMessage>{errors.toWalletId.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="amount">Valor</FieldLabel>
                <Input id="amount" min="0.01" step="0.01" type="number" {...register("amount")} />
                {errors.amount ? <FieldMessage>{errors.amount.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="transactionDate">Data</FieldLabel>
                <Input id="transactionDate" type="date" {...register("transactionDate")} />
                {errors.transactionDate ? <FieldMessage>{errors.transactionDate.message}</FieldMessage> : null}
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="description">Descricao</FieldLabel>
                <Input id="description" {...register("description")} />
                {errors.description ? <FieldMessage>{errors.description.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="categoryId">Categoria</FieldLabel>
                <EntityAutocomplete
                  emptyMessage="Nenhuma categoria encontrada"
                  getId={(item) => item.id}
                  getLabel={(item) => item.name}
                  onOpenModal={() => undefined}
                  onSelect={(item) => {
                    setCategory(item);
                    setValue("categoryId", item.id, { shouldDirty: true, shouldValidate: true });
                  }}
                  placeholder="Pesquisar categoria"
                  search={searchCategories}
                  value={category}
                />
                <input type="hidden" {...register("categoryId")} />
                {errors.categoryId ? <FieldMessage>{errors.categoryId.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="paymentMethodId">Metodo de Pagamento</FieldLabel>
                <EntityAutocomplete
                  emptyMessage="Nenhum metodo encontrado"
                  getId={(item) => item.id}
                  getLabel={(item) => item.name}
                  onOpenModal={() => undefined}
                  onSelect={(item) => {
                    setPaymentMethod(item);
                    setValue("paymentMethodId", item.id, { shouldDirty: true, shouldValidate: true });
                  }}
                  placeholder="Pesquisar metodo"
                  search={searchPaymentMethods}
                  value={paymentMethod}
                />
                <input type="hidden" {...register("paymentMethodId")} />
                {errors.paymentMethodId ? <FieldMessage>{errors.paymentMethodId.message}</FieldMessage> : null}
              </Field>
            </div>
          </form>
        </CardContent>
      </Card>

      {isSuccessModalOpen ? (
        <div aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4" role="dialog">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 size-5 animate-spin text-[var(--color-primary)]" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-[var(--color-foreground)]">Transferencia realizada com sucesso.</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Duas transacoes foram criadas: uma saida na carteira de origem e uma entrada na carteira de destino.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
