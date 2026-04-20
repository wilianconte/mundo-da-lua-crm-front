"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { SearchResultsTable } from "@/features/shared/components/search-results-table";
import { TokenizedSearchFilters } from "@/features/shared/components/tokenized-search-filters";
import { useTokenizedSearch } from "@/features/shared/hooks/use-tokenized-search";
import { GraphQLRequestError } from "@/lib/graphql/client";
import {
  getPaymentMethods,
  type GetPaymentMethodsVariables,
  type PaymentMethodFilterInput,
  type PaymentMethodNode
} from "../api/get-payment-methods";

type FilterFieldKey = "name";
type FilterOperator = "contains" | "equals" | "startsWith";
type SortableColumn = "name";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 10;

const filterFields = [{ key: "name" as FilterFieldKey, label: "Nome", type: "text" as const }];
const operators = [
  { key: "contains" as FilterOperator, label: "contem" },
  { key: "equals" as FilterOperator, label: "e exatamente" },
  { key: "startsWith" as FilterOperator, label: "comeca com" }
];

function mapOperator(operator: FilterOperator): "contains" | "eq" | "startsWith" {
  if (operator === "equals") return "eq";
  if (operator === "startsWith") return "startsWith";
  return "contains";
}

export function PaymentMethodSearchView() {
  const [sortBy, setSortBy] = useState<SortableColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rows, setRows] = useState<PaymentMethodNode[]>([]);
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
    categoryOperator: "contains" as FilterOperator,
    onFiltersChanged: resetToFirstPage
  });

  const where = useMemo<PaymentMethodFilterInput | null>(() => {
    const nextWhere: PaymentMethodFilterInput = {};

    if (freeQuery.trim()) {
      nextWhere.name = { contains: freeQuery.trim() };
    }

    for (const chip of chips) {
      const value = chip.value.trim();
      if (!value) continue;
      if (chip.field.key === "name") {
        nextWhere.name = { [mapOperator(chip.operator as FilterOperator)]: value };
      }
    }

    return Object.keys(nextWhere).length ? nextWhere : null;
  }, [chips, freeQuery]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const variables: GetPaymentMethodsVariables = {
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

        const response = await getPaymentMethods(variables);
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
        setErrorMessage(
          error instanceof GraphQLRequestError ? error.message : "Nao foi possivel carregar metodos de pagamento."
        );
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
            <Link href="/financeiro/metodos-pagamento/cadastro">Adicionar</Link>
          </Button>
        }
        backAriaLabel="Voltar para financeiro"
        backHref="/financeiro"
        description="Gerencie os metodos de pagamento do financeiro"
        title="Metodos de Pagamento"
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

      {errorMessage ? <p className="text-sm font-medium text-[var(--color-danger-strong)]">{errorMessage}</p> : null}

      <SearchResultsTable
        canGoNext={!isLoading && hasNextPage && Boolean(pageEndCursor)}
        canGoPrevious={!isLoading && hasPreviousPage && Boolean(pageStartCursor)}
        columns={[
          { label: "Nome", sortKey: "name" },
          { label: "Carteira Vinculada" },
          { label: "Acoes" }
        ]}
        emptyText="Nenhum metodo de pagamento encontrado"
        isLoading={isLoading}
        loadingText="Carregando metodos de pagamento..."
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
        renderRow={(item) => (
          <tr
            className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-muted)]"
            key={item.id}
          >
            <td className="px-4 py-3">{item.name}</td>
            <td className="px-4 py-3">{item.wallet?.name ?? "-"}</td>
            <td className="px-4 py-3">
              <Button asChild size="sm" variant="outline">
                <Link href={`/financeiro/metodos-pagamento/cadastro?mode=edit&id=${item.id}`}>Editar</Link>
              </Button>
            </td>
          </tr>
        )}
        renderSortIcon={renderSortIcon}
        rows={rows}
        sortBy={sortBy}
        totalText={`${totalCount} metodo(s) encontrado(s).`}
      />
    </div>
  );
}
