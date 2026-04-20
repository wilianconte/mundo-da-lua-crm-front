"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { SearchResultsTable } from "@/features/shared/components/search-results-table";
import { TokenizedSearchFilters } from "@/features/shared/components/tokenized-search-filters";
import { useTokenizedSearch } from "@/features/shared/hooks/use-tokenized-search";
import { GraphQLRequestError } from "@/lib/graphql/client";
import { getWalletsWithBalance, type WalletWithBalance } from "../api/get-wallets";

type FilterFieldKey = "name" | "status";
type FilterOperator = "contains" | "equals";
type SortableColumn = "name" | "initialBalance";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 10;

const filterFields = [
  { key: "name" as FilterFieldKey, label: "Nome", type: "text" as const },
  { key: "status" as FilterFieldKey, label: "Status", type: "category" as const }
];

const operators = [
  { key: "contains" as FilterOperator, label: "contem" },
  { key: "equals" as FilterOperator, label: "e igual a" }
];

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toStatusBool(value: string) {
  const normalized = normalize(value);
  if (normalized === "ativa" || normalized === "ativo" || normalized === "active") return true;
  if (normalized === "inativa" || normalized === "inativo" || normalized === "inactive") return false;
  return null;
}

export function WalletSearchView() {
  const [sortBy, setSortBy] = useState<SortableColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rows, setRows] = useState<WalletWithBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);

  function resetToFirstPage() {
    setPageIndex(0);
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

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getWalletsWithBalance();
        if (!active) return;
        setRows(data);
      } catch (error) {
        if (!active) return;
        setRows([]);
        setErrorMessage(error instanceof GraphQLRequestError ? error.message : "Nao foi possivel carregar carteiras.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    let currentRows = [...rows];

    if (freeQuery.trim()) {
      const query = normalize(freeQuery);
      currentRows = currentRows.filter((item) => normalize(item.name).includes(query));
    }

    for (const chip of chips) {
      const value = chip.value.trim();
      if (!value) continue;

      if (chip.field.key === "status") {
        const status = toStatusBool(value);
        if (status === null) continue;
        currentRows = currentRows.filter((item) => item.isActive === status);
        continue;
      }

      if (chip.field.key === "name") {
        const nextValue = normalize(value);
        currentRows = currentRows.filter((item) => normalize(item.name).includes(nextValue));
      }
    }

    currentRows.sort((a, b) => {
      const factor = sortDirection === "asc" ? 1 : -1;
      if (sortBy === "name") return a.name.localeCompare(b.name) * factor;
      return (a.initialBalance - b.initialBalance) * factor;
    });

    return currentRows;
  }, [chips, freeQuery, rows, sortBy, sortDirection]);

  const totalCount = filteredRows.length;
  const start = pageIndex * PAGE_SIZE;
  const pageRows = filteredRows.slice(start, start + PAGE_SIZE);
  const hasPreviousPage = pageIndex > 0;
  const hasNextPage = start + PAGE_SIZE < totalCount;

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
            <Link href="/financeiro/carteiras/cadastro">Adicionar</Link>
          </Button>
        }
        backAriaLabel="Voltar para financeiro"
        backHref="/financeiro"
        description="Gerencie as carteiras financeiras"
        title="Carteiras"
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
        canGoNext={!isLoading && hasNextPage}
        canGoPrevious={!isLoading && hasPreviousPage}
        columns={[
          { label: "Nome", sortKey: "name" },
          { label: "Saldo Inicial", sortKey: "initialBalance" },
          { label: "Status" },
          { label: "Acoes" }
        ]}
        emptyText="Nenhuma carteira encontrada"
        isLoading={isLoading}
        loadingText="Carregando carteiras..."
        onNextPage={() => setPageIndex((current) => current + 1)}
        onPreviousPage={() => setPageIndex((current) => Math.max(current - 1, 0))}
        onToggleSort={toggleSort}
        renderRow={(wallet) => (
          <tr
            className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-muted)]"
            key={wallet.id}
          >
            <td className="px-4 py-3">{wallet.name}</td>
            <td className="px-4 py-3">{toCurrency(wallet.initialBalance)}</td>
            <td className="px-4 py-3">
              <Badge variant={wallet.isActive ? "success" : "attention"}>{wallet.isActive ? "Ativa" : "Inativa"}</Badge>
            </td>
            <td className="px-4 py-3">
              <Button asChild size="sm" variant="outline">
                <Link href={`/financeiro/carteiras/cadastro?mode=edit&id=${wallet.id}`}>Editar</Link>
              </Button>
            </td>
          </tr>
        )}
        renderSortIcon={renderSortIcon}
        rows={pageRows}
        sortBy={sortBy}
        totalText={`${totalCount} carteira(s) encontrada(s).`}
      />
    </div>
  );
}
