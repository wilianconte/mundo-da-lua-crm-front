"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { SearchResultsTable } from "@/features/shared/components/search-results-table";
import { TokenizedSearchFilters } from "@/features/shared/components/tokenized-search-filters";
import { useTokenizedSearch } from "@/features/shared/hooks/use-tokenized-search";
import { GraphQLRequestError } from "@/lib/graphql/client";
import {
  getTransactions,
  type GetTransactionsVariables,
  type TransactionFilterInput,
  type TransactionNode,
  type TransactionType
} from "../api/get-transactions";

type FilterFieldKey = "description" | "type" | "wallet";
type FilterOperator = "contains" | "equals";
type SortableColumn = "transactionDate" | "amount" | "description" | "type";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 10;

const filterFields = [
  { key: "description" as FilterFieldKey, label: "Descricao", type: "text" as const },
  { key: "type" as FilterFieldKey, label: "Tipo", type: "category" as const },
  { key: "wallet" as FilterFieldKey, label: "Carteira", type: "text" as const }
];

const operators = [
  { key: "contains" as FilterOperator, label: "contem" },
  { key: "equals" as FilterOperator, label: "e igual a" }
];

function toCurrency(value: number, type: TransactionType) {
  const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
  return { label: formatted, className: type === "INCOME" ? "text-emerald-600" : "text-rose-600" };
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

function toTypeBadge(type: TransactionType) {
  return <Badge variant={type === "INCOME" ? "success" : "attention"}>{toTypeLabel(type)}</Badge>;
}

function mapType(value: string): TransactionType | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "entrada" || normalized === "income") return "INCOME";
  if (normalized === "saida" || normalized === "expense") return "EXPENSE";
  return null;
}

export function TransactionSearchView() {
  const [sortBy, setSortBy] = useState<SortableColumn>("transactionDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [rows, setRows] = useState<TransactionNode[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [pageStartCursor, setPageStartCursor] = useState<string | null>(null);
  const [pageEndCursor, setPageEndCursor] = useState<string | null>(null);
  const [requestAfter, setRequestAfter] = useState<string | null>(null);
  const [requestBefore, setRequestBefore] = useState<string | null>(null);
  const [cursorMode, setCursorMode] = useState<"forward" | "backward">("forward");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  function resetToFirstPage() {
    setCursorMode("forward");
    setRequestAfter(null);
    setRequestBefore(null);
  }

  const {
    searchInput,
    freeQuery,
    selectedField,
    selectedOperator,
    chips,
    isFieldDropdownOpen,
    setSelectedOperator,
    openFieldDropdown,
    selectField,
    clearSelectedField,
    handleInputChange,
    handleInputKeyDown,
    addChip,
    removeChip
  } = useTokenizedSearch({
    textOperator: "contains" as FilterOperator,
    categoryOperator: "equals" as FilterOperator,
    onFiltersChanged: resetToFirstPage
  });

  const where = useMemo<TransactionFilterInput | null>(() => {
    const nextWhere: TransactionFilterInput = {};

    if (freeQuery.trim()) {
      nextWhere.description = { contains: freeQuery.trim() };
    }

    for (const chip of chips) {
      const value = chip.value.trim();
      if (!value) continue;

      if (chip.field.key === "type") {
        const mapped = mapType(value);
        if (mapped) nextWhere.type = { eq: mapped };
        continue;
      }

      if (chip.field.key === "wallet") {
        nextWhere.wallet = { name: { contains: value } } as TransactionFilterInput["wallet"];
        continue;
      }

      if (chip.field.key === "description") {
        nextWhere.description = { contains: value };
      }
    }

    if (startDate || endDate) {
      nextWhere.transactionDate = {
        ...(startDate ? { gte: `${startDate}T00:00:00.000Z` } : {}),
        ...(endDate ? { lte: `${endDate}T23:59:59.999Z` } : {})
      };
    }

    return Object.keys(nextWhere).length ? nextWhere : null;
  }, [chips, endDate, freeQuery, startDate]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const variables: GetTransactionsVariables = {
          where,
          order: [{ [sortBy]: sortDirection === "asc" ? "ASC" : "DESC" }]
        };

        if (cursorMode === "backward") {
          variables.last = PAGE_SIZE;
          variables.before = requestBefore;
        } else {
          variables.first = PAGE_SIZE;
          variables.after = requestAfter;
        }

        if (!requestAfter && !requestBefore) {
          variables.first = PAGE_SIZE;
          variables.after = null;
          delete variables.last;
          delete variables.before;
        }

        const response = await getTransactions(variables);
        if (!active) return;

        setRows(response.nodes ?? []);
        setTotalCount(response.totalCount ?? 0);
        setHasNextPage(Boolean(response.pageInfo?.hasNextPage));
        setHasPreviousPage(Boolean(response.pageInfo?.hasPreviousPage));
        setPageStartCursor(response.pageInfo?.startCursor ?? null);
        setPageEndCursor(response.pageInfo?.endCursor ?? null);
      } catch (error) {
        if (!active) return;
        setRows([]);
        setTotalCount(0);
        setErrorMessage(error instanceof GraphQLRequestError ? error.message : "Nao foi possivel carregar transacoes.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [where, sortBy, sortDirection, cursorMode, requestAfter, requestBefore]);

  function toggleSort(column: SortableColumn) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection("asc");
      resetToFirstPage();
      return;
    }

    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    resetToFirstPage();
  }

  function renderSortIcon(column: SortableColumn) {
    if (sortBy !== column) return null;
    return sortDirection === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
  }

  return (
    <div className="space-y-6">
      <FeatureViewHeader
        actions={
          <Button asChild className="min-w-40" leadingIcon={<Plus className="size-4" />}>
            <Link href="/financeiro/transacoes/cadastro">Adicionar</Link>
          </Button>
        }
        backAriaLabel="Voltar para financeiro"
        backHref="/financeiro"
        description="Registro de entradas e saidas financeiras"
        title="Transacoes"
      />

      <TokenizedSearchFilters
        availableOperators={operators}
        chips={chips}
        filterFields={filterFields}
        getOperatorLabel={(operator) => operators.find((item) => item.key === operator)?.label ?? operator}
        inputRef={inputRef}
        isFieldDropdownOpen={isFieldDropdownOpen}
        onClearSelectedField={() => clearSelectedField(inputRef)}
        onFilterClick={() => {
          if (selectedField) addChip();
        }}
        onInputChange={handleInputChange}
        onInputKeyDown={handleInputKeyDown}
        onOpenFieldDropdown={openFieldDropdown}
        onOperatorChange={(operator) => setSelectedOperator(operator)}
        onRemoveChip={removeChip}
        onSelectField={(field) => selectField(field, inputRef)}
        searchInput={searchInput}
        selectedField={selectedField}
        selectedOperator={selectedOperator}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldDate label="Data Inicio" onChange={setStartDate} value={startDate} />
        <FieldDate label="Data Fim" onChange={setEndDate} value={endDate} />
      </div>

      {errorMessage ? <p className="text-sm font-medium text-[var(--color-danger-strong)]">{errorMessage}</p> : null}

      <SearchResultsTable
        canGoNext={!isLoading && hasNextPage && Boolean(pageEndCursor)}
        canGoPrevious={!isLoading && hasPreviousPage && Boolean(pageStartCursor)}
        columns={[
          { label: "Data", sortKey: "transactionDate" },
          { label: "Descricao", sortKey: "description" },
          { label: "Tipo", sortKey: "type" },
          { label: "Valor", sortKey: "amount" },
          { label: "Categoria" },
          { label: "Metodo" },
          { label: "Carteira" },
          { label: "Conciliada" },
          { label: "Acoes" }
        ]}
        emptyText="Nenhuma transacao encontrada"
        isLoading={isLoading}
        loadingText="Carregando transacoes..."
        onNextPage={() => {
          setCursorMode("forward");
          setRequestBefore(null);
          setRequestAfter(pageEndCursor);
        }}
        onPreviousPage={() => {
          setCursorMode("backward");
          setRequestAfter(null);
          setRequestBefore(pageStartCursor);
        }}
        onToggleSort={toggleSort}
        renderRow={(item) => {
          const money = toCurrency(item.amount, item.type);
          return (
            <tr
              className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-muted)]"
              key={item.id}
            >
              <td className="px-4 py-3">{toDate(item.transactionDate)}</td>
              <td className="px-4 py-3">{item.description}</td>
              <td className="px-4 py-3">{toTypeBadge(item.type)}</td>
              <td className={`px-4 py-3 font-semibold ${money.className}`}>{money.label}</td>
              <td className="px-4 py-3">{item.category?.name ?? "-"}</td>
              <td className="px-4 py-3">{item.paymentMethod?.name ?? "-"}</td>
              <td className="px-4 py-3">{item.wallet?.name ?? "-"}</td>
              <td className="px-4 py-3">
                <Badge variant={item.isReconciled ? "success" : "neutral"}>{item.isReconciled ? "Sim" : "Nao"}</Badge>
              </td>
              <td className="px-4 py-3">
                <Button
                  asChild={!item.isReconciled}
                  disabled={item.isReconciled}
                  size="sm"
                  title={item.isReconciled ? "Transacao conciliada nao pode ser editada" : undefined}
                  variant="outline"
                >
                  {item.isReconciled ? <span>Editar</span> : <Link href={`/financeiro/transacoes/cadastro?mode=edit&id=${item.id}`}>Editar</Link>}
                </Button>
              </td>
            </tr>
          );
        }}
        renderSortIcon={renderSortIcon}
        rows={rows}
        sortBy={sortBy}
        tableMinWidthClassName="min-w-[1400px]"
        totalText={`${totalCount} transacao(oes) encontrada(s).`}
      />
    </div>
  );
}

function FieldDate({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-sm font-medium text-[var(--color-foreground)]">
      <span>{label}</span>
      <Input onChange={(event) => onChange(event.target.value)} type="date" value={value} />
    </label>
  );
}
