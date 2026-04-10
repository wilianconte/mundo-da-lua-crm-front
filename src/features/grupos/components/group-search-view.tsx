"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchResultsTable } from "@/features/shared/components/search-results-table";
import { TokenizedSearchFilters } from "@/features/shared/components/tokenized-search-filters";
import { GraphQLRequestError } from "@/lib/graphql/client";
import {
  getRoles,
  type GetRolesVariables,
  type RoleFilterInput,
  type RoleNode
} from "@/features/grupos/api/get-roles";

type FilterFieldKey = "name" | "description" | "isActive";
type FieldType = "text" | "category";
type TextOperator = "contains" | "equals" | "startsWith";
type CategoryOperator = "equals" | "notEquals";
type FilterOperator = TextOperator | CategoryOperator;
type SortableColumn = "name" | "isActive";
type SortDirection = "asc" | "desc";
type CursorMode = "forward" | "backward";

type FilterField = {
  key: FilterFieldKey;
  label: string;
  type: FieldType;
};

type FilterChip = {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
};

const PAGE_SIZE = 10;

const filterFields: FilterField[] = [
  { key: "name", label: "Nome", type: "text" },
  { key: "description", label: "Descricao", type: "text" },
  { key: "isActive", label: "Status", type: "category" }
];

const textOperators: Array<{ key: TextOperator; label: string }> = [
  { key: "contains", label: "contem" },
  { key: "equals", label: "e exatamente" },
  { key: "startsWith", label: "comeca com" }
];

const categoryOperators: Array<{ key: CategoryOperator; label: string }> = [
  { key: "equals", label: "e igual a" },
  { key: "notEquals", label: "e diferente de" }
];

const tableColumns: Array<{ label: string; sortKey?: SortableColumn }> = [
  { label: "Nome", sortKey: "name" },
  { label: "Descricao" },
  { label: "Usuarios" },
  { label: "Status", sortKey: "isActive" },
  { label: "Acao" }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toStatusBool(value: string): boolean | null {
  const normalized = normalize(value);

  if (normalized === "active" || normalized === "ativo") return true;
  if (normalized === "inactive" || normalized === "inativo") return false;

  return null;
}

function mapSortColumn(column: SortableColumn) {
  if (column === "isActive") return "isActive";
  return "name";
}

function mapTextOperator(operator: TextOperator): "contains" | "eq" | "startsWith" {
  if (operator === "equals") return "eq";
  if (operator === "startsWith") return "startsWith";
  return "contains";
}

export function GroupSearchView() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [freeQuery, setFreeQuery] = useState("");
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("contains");
  const [chips, setChips] = useState<FilterChip[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortableColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rows, setRows] = useState<RoleNode[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [pageStartCursor, setPageStartCursor] = useState<string | null>(null);
  const [pageEndCursor, setPageEndCursor] = useState<string | null>(null);
  const [requestAfter, setRequestAfter] = useState<string | null>(null);
  const [requestBefore, setRequestBefore] = useState<string | null>(null);
  const [cursorMode, setCursorMode] = useState<CursorMode>("forward");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const availableOperators = selectedField?.type === "category" ? categoryOperators : textOperators;

  const where = useMemo<RoleFilterInput | null>(() => {
    const nextWhere: RoleFilterInput = {};

    if (freeQuery.trim()) {
      nextWhere.or = [
        { name: { contains: freeQuery.trim() } },
        { description: { contains: freeQuery.trim() } }
      ];
    }

    for (const chip of chips) {
      if (chip.field.key === "isActive") {
        const isActive = toStatusBool(chip.value);
        if (isActive === null) {
          continue;
        }

        nextWhere.isActive = chip.operator === "notEquals" ? { neq: isActive } : { eq: isActive };
        continue;
      }

      const key = chip.field.key;
      const value = chip.value.trim();
      if (!value) {
        continue;
      }

      const operator = mapTextOperator(chip.operator as TextOperator);
      nextWhere[key] = { [operator]: value };
    }

    return Object.keys(nextWhere).length ? nextWhere : null;
  }, [chips, freeQuery]);

  useEffect(() => {
    let isMounted = true;

    async function loadRoles() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const variables: GetRolesVariables = {
          where,
          order: [{ [mapSortColumn(sortBy)]: sortDirection === "asc" ? "ASC" : "DESC" }]
        };

        if (cursorMode === "backward") {
          variables.last = PAGE_SIZE;
          variables.before = requestBefore;
        } else {
          variables.first = PAGE_SIZE;
          variables.after = requestAfter;
        }

        if (!requestBefore && !requestAfter) {
          variables.first = PAGE_SIZE;
          variables.after = null;
          delete variables.last;
          delete variables.before;
        }

        const response = await getRoles(variables);
        if (!isMounted) return;

        setRows(response.nodes ?? []);
        setTotalCount(response.totalCount ?? 0);
        setHasNextPage(Boolean(response.pageInfo?.hasNextPage));
        setHasPreviousPage(Boolean(response.pageInfo?.hasPreviousPage));
        setPageStartCursor(response.pageInfo?.startCursor ?? null);
        setPageEndCursor(response.pageInfo?.endCursor ?? null);
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof GraphQLRequestError
            ? error.message
            : "Nao foi possivel carregar a pesquisa de grupos.";

        setRows([]);
        setTotalCount(0);
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRoles();

    return () => {
      isMounted = false;
    };
  }, [where, sortBy, sortDirection, cursorMode, requestAfter, requestBefore]);

  function resetToFirstPage() {
    setCursorMode("forward");
    setRequestAfter(null);
    setRequestBefore(null);
  }

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

  function openFieldDropdown() {
    setIsFieldDropdownOpen(true);
  }

  function selectField(field: FilterField) {
    setSelectedField(field);
    setSelectedOperator(field.type === "category" ? "equals" : "contains");
    setIsFieldDropdownOpen(false);
    setSearchInput("");
    setFreeQuery("");
    inputRef.current?.focus();
  }

  function addChip() {
    if (!selectedField) return;
    const value = searchInput.trim();
    if (!value) return;

    const chip: FilterChip = {
      id: `${selectedField.key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      field: selectedField,
      operator: selectedOperator,
      value
    };

    setChips((current) => [...current, chip]);
    setSearchInput("");
    setIsFieldDropdownOpen(false);
    resetToFirstPage();
  }

  function handleInputChange(value: string) {
    setSearchInput(value);

    if (selectedField) return;

    if (value.includes("@")) {
      setIsFieldDropdownOpen(true);
      setFreeQuery("");
      return;
    }

    setIsFieldDropdownOpen(false);
    setFreeQuery(value);
    resetToFirstPage();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!selectedField) return;
    if (event.key !== "Enter" && event.key !== "Tab") return;

    event.preventDefault();
    addChip();
  }

  function removeChip(id: string) {
    setChips((current) => current.filter((chip) => chip.id !== id));
    resetToFirstPage();
  }

  function getOperatorLabel(operator: FilterOperator) {
    return [...textOperators, ...categoryOperators].find((item) => item.key === operator)?.label ?? operator;
  }

  function openEditGroup(role: RoleNode) {
    const params = new URLSearchParams({
      mode: "edit",
      id: role.id
    });

    router.push(`/grupos/cadastro?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">Grupos</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Pesquisa de grupos</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Omnisearch com filtros tokenizados por nome, descricao e status.
            </p>
          </div>
          <Button className="min-w-40" leadingIcon={<Plus className="size-4" />} onClick={() => router.push("/grupos/cadastro")}>
            Adicionar
          </Button>
        </div>
      </section>

      <section className="space-y-5">
        <TokenizedSearchFilters
          availableOperators={availableOperators}
          chips={chips}
          filterFields={filterFields}
          getOperatorLabel={getOperatorLabel}
          inputRef={inputRef}
          isFieldDropdownOpen={isFieldDropdownOpen}
          onClearSelectedField={() => {
            setSelectedField(null);
            setSearchInput("");
            inputRef.current?.focus();
          }}
          onFilterClick={() => {
            if (selectedField) addChip();
          }}
          onInputChange={handleInputChange}
          onInputKeyDown={handleInputKeyDown}
          onOpenFieldDropdown={openFieldDropdown}
          onOperatorChange={(operator) => setSelectedOperator(operator)}
          onRemoveChip={removeChip}
          onSelectField={selectField}
          searchInput={searchInput}
          selectedField={selectedField}
          selectedOperator={selectedOperator}
        />

        {errorMessage ? (
          <p className="text-sm font-medium text-[var(--color-danger-strong)]">{errorMessage}</p>
        ) : null}

        <SearchResultsTable
          canGoNext={!isLoading && hasNextPage && Boolean(pageEndCursor)}
          canGoPrevious={!isLoading && hasPreviousPage && Boolean(pageStartCursor)}
          columns={tableColumns}
          emptyText="Nenhum grupo encontrado com os filtros atuais."
          isLoading={isLoading}
          loadingText="Carregando grupos..."
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
          renderRow={(role) => (
            <tr
              className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-muted)]"
              key={role.id}
            >
              <td className="px-4 py-3">{role.name}</td>
              <td className="px-4 py-3">{role.description || "-"}</td>
              <td className="px-4 py-3">
                <Badge variant={role.isActive ? "success" : "attention"}>{role.isActive ? "Ativo" : "Inativo"}</Badge>
              </td>
              <td className="px-4 py-3">{role.usersCount}</td>
              <td className="px-4 py-3">
                <Button onClick={() => openEditGroup(role)} size="sm" variant="outline">
                  Editar
                </Button>
              </td>
            </tr>
          )}
          renderSortIcon={renderSortIcon}
          rows={rows}
          sortBy={sortBy}
          totalText={`${totalCount} grupos encontrados com os filtros atuais.`}
          tableMinWidthClassName="min-w-[1080px]"
        />
      </section>
    </div>
  );
}
