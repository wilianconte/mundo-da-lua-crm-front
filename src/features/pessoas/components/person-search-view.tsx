"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getPeople,
  type GetPeopleVariables,
  type PersonFilterInput,
  type PersonNode,
  type PersonStatus
} from "@/features/pessoas/api/get-people";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { SearchResultsTable } from "@/features/shared/components/search-results-table";
import { TokenizedSearchFilters } from "@/features/shared/components/tokenized-search-filters";
import { GraphQLRequestError } from "@/lib/graphql/client";

type FilterFieldKey = "fullName" | "documentNumber" | "email" | "primaryPhone" | "status" | "occupation";
type FieldType = "text" | "category";
type TextOperator = "contains" | "equals" | "startsWith";
type CategoryOperator = "equals" | "notEquals";
type FilterOperator = TextOperator | CategoryOperator;
type SortableColumn = "fullName" | "documentNumber" | "primaryPhone" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

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

const PAGE_SIZE = 8;

const filterFields: FilterField[] = [
  { key: "fullName", label: "Nome", type: "text" },
  { key: "documentNumber", label: "CPF/CNPJ", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "primaryPhone", label: "Telefone", type: "text" },
  { key: "status", label: "Status", type: "category" },
  { key: "occupation", label: "Profissao", type: "text" }
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
  { label: "Nome", sortKey: "fullName" },
  { label: "E-mail" },
  { label: "Documento", sortKey: "documentNumber" },
  { label: "Telefone", sortKey: "primaryPhone" },
  { label: "Status", sortKey: "status" },
  { label: "Criado em", sortKey: "createdAt" },
  { label: "Acao" }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toStatusEnum(value: string): PersonStatus | null {
  const normalized = normalize(value);

  if (normalized === "active" || normalized === "ativo") return "ACTIVE";
  if (normalized === "inactive" || normalized === "inativo") return "INACTIVE";
  if (normalized === "blocked" || normalized === "bloqueado") return "BLOCKED";

  return null;
}

function toStatusLabel(status: PersonStatus) {
  if (status === "ACTIVE") return "Ativo";
  if (status === "INACTIVE") return "Inativo";
  return "Bloqueado";
}

function toDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-BR");
}

function mapSortColumn(column: SortableColumn) {
  if (column === "fullName") return "fullName";
  if (column === "documentNumber") return "documentNumber";
  if (column === "primaryPhone") return "primaryPhone";
  if (column === "status") return "status";
  return "createdAt";
}

function mapTextOperator(operator: TextOperator): "contains" | "eq" | "startsWith" {
  if (operator === "equals") return "eq";
  if (operator === "startsWith") return "startsWith";
  return "contains";
}

type CursorMode = "forward" | "backward";

type PersonSearchViewProps = {
  basePath?: string;
  sectionLabel?: string;
  title?: string;
  description?: string;
  loadingText?: string;
  emptyText?: string;
  totalText?: (totalCount: number) => string;
};

export function PersonSearchView({
  basePath = "/pessoas",
  sectionLabel = "Pessoas",
  title = "Pesquisa de pessoas",
  description = "Omnisearch com filtros tokenizados e busca livre global por nome, email e documento.",
  loadingText = "Carregando pessoas...",
  emptyText = "Nenhuma pessoa encontrada com os filtros atuais.",
  totalText = (totalCount) => `${totalCount} pessoas encontradas com os filtros atuais.`
}: PersonSearchViewProps = {}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [freeQuery, setFreeQuery] = useState("");
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("contains");
  const [chips, setChips] = useState<FilterChip[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortableColumn>("fullName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rows, setRows] = useState<PersonNode[]>([]);
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

  const where = useMemo<PersonFilterInput | null>(() => {
    const nextWhere: PersonFilterInput = {};

    if (freeQuery.trim()) {
      nextWhere.or = [
        { fullName: { contains: freeQuery.trim() } },
        { email: { contains: freeQuery.trim() } },
        { documentNumber: { contains: freeQuery.trim() } }
      ];
    }

    for (const chip of chips) {
      if (chip.field.key === "status") {
        const status = toStatusEnum(chip.value);
        if (!status) {
          continue;
        }

        nextWhere.status = chip.operator === "notEquals" ? { neq: status } : { eq: status };
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

    async function loadPeople() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const variables: GetPeopleVariables = {
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

        const response = await getPeople(variables);
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
            : "Nao foi possivel carregar a pesquisa de pessoas.";
        setRows([]);
        setTotalCount(0);
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPeople();

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
    return (
      [...textOperators, ...categoryOperators].find((item) => item.key === operator)?.label ?? operator
    );
  }

  function openEditPerson(person: PersonNode) {
    const params = new URLSearchParams({
      mode: "edit",
      id: person.id
    });

    router.push(`${basePath}/cadastro?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <span className="sr-only">{sectionLabel}</span>
        <FeatureViewHeader
          actions={
            <Button
              className="min-w-40"
              leadingIcon={<Plus className="size-4" />}
              onClick={() => router.push(`${basePath}/cadastro`)}
            >
              Adicionar
            </Button>
          }
          backAriaLabel="Voltar para o dashboard"
          backHref="/"
          description={description}
          title={title}
        />
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
          emptyText={emptyText}
          isLoading={isLoading}
          loadingText={loadingText}
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
          renderRow={(person) => (
            <tr
              className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-muted)]"
              key={person.id}
            >
              <td className="px-4 py-3">{person.fullName}</td>
              <td className="px-4 py-3">{person.email ?? "-"}</td>
              <td className="px-4 py-3">{person.documentNumber ?? "-"}</td>
              <td className="px-4 py-3">{person.primaryPhone ?? "-"}</td>
              <td className="px-4 py-3">
                <Badge variant={person.status === "ACTIVE" ? "success" : "attention"}>
                  {toStatusLabel(person.status)}
                </Badge>
              </td>
              <td className="px-4 py-3">{toDateTime(person.createdAt)}</td>
              <td className="px-4 py-3">
                <Button onClick={() => openEditPerson(person)} size="sm" variant="outline">
                  Editar
                </Button>
              </td>
            </tr>
          )}
          renderSortIcon={renderSortIcon}
          rows={rows}
          sortBy={sortBy}
          totalText={totalText(totalCount)}
        />
      </section>
    </div>
  );
}

