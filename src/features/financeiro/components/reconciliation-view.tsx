"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { EntityAutocomplete } from "@/features/shared/components/entity-autocomplete";
import { getTransactions, type TransactionNode, type TransactionType } from "../api/get-transactions";
import { getWallets, type WalletNode } from "../api/get-wallets";
import { mapReconciliationApiError, reconcileTransaction } from "../api/reconcile";
import { reconciliationSchema, type ReconciliationSchema } from "../schema/reconciliation-schema";

const PAGE_SIZE = 8;

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function toDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function toTypeLabel(type: TransactionType) {
  return type === "INCOME" ? "Entrada" : "Saida";
}

export function ReconciliationView() {
  const [selectedWallet, setSelectedWallet] = useState<WalletNode | null>(null);
  const [transactions, setTransactions] = useState<TransactionNode[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionNode | null>(null);
  const [typeFilter, setTypeFilter] = useState<"ALL" | TransactionType>("ALL");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isSubmittingReconciliation, setIsSubmittingReconciliation] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ReconciliationSchema>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: {
      transactionId: "00000000-0000-0000-0000-000000000000",
      externalId: "",
      externalAmount: 0,
      externalDate: new Date().toISOString().slice(0, 10)
    }
  });

  const externalAmount = watch("externalAmount");

  async function searchWallets(input: { query: string }) {
    const response = await getWallets({
      first: 20,
      where: { isActive: { eq: true }, name: { contains: input.query.trim() } },
      order: [{ name: "ASC" }]
    });

    return response.nodes;
  }

  useEffect(() => {
    const walletId = selectedWallet?.id;
    if (!walletId) {
      setTransactions([]);
      setSelectedTransaction(null);
      setListError(null);
      return;
    }

    let active = true;

    async function loadTransactions() {
      try {
        setIsLoadingTransactions(true);
        setListError(null);
        setSuccessMessage(null);

        const transactionDateFilter = {
          ...(startDate ? { gte: `${startDate}T00:00:00.000Z` } : {}),
          ...(endDate ? { lte: `${endDate}T23:59:59.999Z` } : {})
        };

        const response = await getTransactions({
          first: 200,
          where: {
            isReconciled: { eq: false },
            isDeleted: { eq: false },
            walletId: { eq: walletId },
            ...(typeFilter === "ALL" ? {} : { type: { eq: typeFilter } }),
            ...(Object.keys(transactionDateFilter).length ? { transactionDate: transactionDateFilter } : {})
          },
          order: [{ transactionDate: "DESC" }]
        });

        if (!active) return;
        setTransactions(response.nodes);

        if (selectedTransaction && !response.nodes.some((item) => item.id === selectedTransaction.id)) {
          setSelectedTransaction(null);
          setValue("transactionId", "00000000-0000-0000-0000-000000000000");
        }
      } catch {
        if (!active) return;
        setTransactions([]);
        setListError("Nao foi possivel carregar transacoes pendentes.");
      } finally {
        if (active) setIsLoadingTransactions(false);
      }
    }

    void loadTransactions();

    return () => {
      active = false;
    };
  }, [selectedWallet, startDate, endDate, typeFilter, selectedTransaction, setValue]);

  useEffect(() => {
    setPageIndex(0);
  }, [transactions]);

  const pageRows = useMemo(() => {
    const start = pageIndex * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [pageIndex, transactions]);

  const hasPreviousPage = pageIndex > 0;
  const hasNextPage = (pageIndex + 1) * PAGE_SIZE < transactions.length;

  const showDivergenceAlert = Boolean(
    selectedTransaction && Number(externalAmount) > 0 && Number(externalAmount) !== Number(selectedTransaction.amount)
  );

  async function onSubmit(values: ReconciliationSchema) {
    if (!selectedTransaction) return;

    try {
      setActionError(null);
      setSuccessMessage(null);
      setIsSubmittingReconciliation(true);

      await reconcileTransaction({
        transactionId: selectedTransaction.id,
        externalId: values.externalId.trim(),
        externalAmount: Number(values.externalAmount),
        externalDate: `${values.externalDate}T12:00:00.000Z`
      });

      setSuccessMessage("Transacao conciliada com sucesso");
      setTransactions((current) => current.filter((item) => item.id !== selectedTransaction.id));
      setSelectedTransaction(null);
      reset({
        transactionId: "00000000-0000-0000-0000-000000000000",
        externalId: "",
        externalAmount: 0,
        externalDate: new Date().toISOString().slice(0, 10)
      });
    } catch (error) {
      setActionError(mapReconciliationApiError(error));
    } finally {
      setIsSubmittingReconciliation(false);
    }
  }

  return (
    <div className="space-y-6">
      <FeatureViewHeader
        backAriaLabel="Voltar para financeiro"
        backHref="/financeiro"
        description="Vincule transacoes internas a registros do extrato bancario externo"
        title="Conciliacao Bancaria"
      />

      {successMessage ? (
        <div className="rounded-[var(--radius-md)] border border-emerald-400/40 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transacoes Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel>Carteira</FieldLabel>
              <EntityAutocomplete
                emptyMessage="Nenhuma carteira encontrada"
                getId={(wallet) => wallet.id}
                getLabel={(wallet) => wallet.name}
                onOpenModal={() => undefined}
                onSelect={(wallet) => {
                  setSelectedWallet(wallet);
                  setSelectedTransaction(null);
                  setActionError(null);
                }}
                placeholder="Selecione uma carteira"
                search={searchWallets}
                value={selectedWallet}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="startDate">Data inicio</FieldLabel>
                <Input id="startDate" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
              </Field>
              <Field>
                <FieldLabel htmlFor="endDate">Data fim</FieldLabel>
                <Input id="endDate" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="typeFilter">Tipo</FieldLabel>
              <select
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none"
                id="typeFilter"
                onChange={(event) => setTypeFilter(event.target.value as "ALL" | TransactionType)}
                value={typeFilter}
              >
                <option value="ALL">Todos</option>
                <option value="INCOME">Entradas</option>
                <option value="EXPENSE">Saidas</option>
              </select>
            </Field>

            {!selectedWallet ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">Selecione uma carteira para ver transacoes pendentes</p>
            ) : null}

            {listError ? <p className="text-sm font-medium text-[var(--color-danger-strong)]">{listError}</p> : null}

            {isLoadingTransactions ? <p className="text-sm text-[var(--color-muted-foreground)]">Carregando transacoes pendentes...</p> : null}

            {selectedWallet && !isLoadingTransactions && !transactions.length ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">Nenhuma transacao pendente para conciliacao nesta carteira</p>
            ) : null}

            {pageRows.length ? (
              <div className="space-y-2">
                {pageRows.map((item) => (
                  <button
                    className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-left transition ${
                      selectedTransaction?.id === item.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]"
                    }`}
                    key={item.id}
                    onClick={() => {
                      setSelectedTransaction(item);
                      setValue("transactionId", item.id);
                      setValue("externalAmount", Number(item.amount));
                      setValue("externalDate", toDateInput(item.transactionDate));
                      setActionError(null);
                    }}
                    type="button"
                  >
                    <div className="grid gap-2 sm:grid-cols-[110px_1fr_auto_auto] sm:items-center">
                      <span className="text-xs text-[var(--color-muted-foreground)]">{toDate(item.transactionDate)}</span>
                      <span className="text-sm font-medium text-[var(--color-foreground)]">{item.description}</span>
                      <span className="text-sm font-semibold">{toCurrency(Number(item.amount))}</span>
                      <Badge variant={item.type === "INCOME" ? "success" : "attention"}>{toTypeLabel(item.type)}</Badge>
                    </div>
                  </button>
                ))}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button disabled={!hasPreviousPage} onClick={() => setPageIndex((current) => current - 1)} size="sm" variant="outline">
                    Anterior
                  </Button>
                  <Button disabled={!hasNextPage} onClick={() => setPageIndex((current) => current + 1)} size="sm" variant="outline">
                    Proxima
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Conciliacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedTransaction ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">Selecione uma transacao pendente para conciliar.</p>
            ) : (
              <>
                <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm">
                  <p><span className="font-medium">Descricao:</span> {selectedTransaction.description}</p>
                  <p><span className="font-medium">Valor:</span> {toCurrency(Number(selectedTransaction.amount))}</p>
                  <p><span className="font-medium">Data:</span> {toDate(selectedTransaction.transactionDate)}</p>
                  <p><span className="font-medium">Tipo:</span> {toTypeLabel(selectedTransaction.type)}</p>
                  <p><span className="font-medium">Carteira:</span> {selectedWallet?.name ?? "-"}</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <input type="hidden" {...register("transactionId")} />

                  <Field>
                    <FieldLabel htmlFor="externalId">ID Externo</FieldLabel>
                    <Input id="externalId" placeholder="Identificador no extrato" {...register("externalId")} />
                    {errors.externalId ? <FieldMessage>{errors.externalId.message}</FieldMessage> : null}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="externalAmount">Valor Externo</FieldLabel>
                    <Input id="externalAmount" min="0.01" step="0.01" type="number" {...register("externalAmount")} />
                    {errors.externalAmount ? <FieldMessage>{errors.externalAmount.message}</FieldMessage> : null}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="externalDate">Data Externa</FieldLabel>
                    <Input id="externalDate" type="date" {...register("externalDate")} />
                    {errors.externalDate ? <FieldMessage>{errors.externalDate.message}</FieldMessage> : null}
                  </Field>

                  {showDivergenceAlert ? (
                    <div className="rounded-[var(--radius-md)] border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      <p className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 size-4" />
                        Atencao: o valor externo ({toCurrency(Number(externalAmount))}) difere do valor da transacao ({toCurrency(Number(selectedTransaction.amount))}). Deseja conciliar mesmo assim?
                      </p>
                    </div>
                  ) : null}

                  {actionError ? <p className="text-sm font-medium text-[var(--color-danger-strong)]">{actionError}</p> : null}

                  <Button className="min-w-40" disabled={isSubmittingReconciliation} type="submit">
                    {isSubmittingReconciliation ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Conciliando...</span>
                    ) : (
                      "Conciliar"
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function toDateInput(value?: string | null) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}
