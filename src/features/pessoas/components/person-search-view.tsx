"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
type AdditionalFieldKey = "id" | "createdDate" | "createdTime";
type PersonColumnId =
  | "fullName"
  | "email"
  | "documentNumber"
  | "primaryPhone"
  | "status"
  | "createdAt"
  | "action"
  | `extra:${AdditionalFieldKey}`;

type PersonSearchViewProps = {
  basePath?: string;
  sectionLabel?: string;
  title?: string;
  description?: string;
  loadingText?: string;
  emptyText?: string;
  totalText?: (totalCount: number) => string;
};

type AdditionalFieldOption = {
  key: AdditionalFieldKey;
  label: string;
  description: string;
};

const additionalFieldOptions: AdditionalFieldOption[] = [
  { key: "id", label: "ID", description: "Identificador unico da pessoa." },
  { key: "createdDate", label: "Data de criacao", description: "Somente a data do cadastro." },
  { key: "createdTime", label: "Hora de criacao", description: "Somente o horario do cadastro." }
];

const DEFAULT_ORDERED_COLUMN_IDS: PersonColumnId[] = [
  "fullName",
  "email",
  "documentNumber",
  "primaryPhone",
  "status",
  "createdAt",
  "action"
];

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
  const [isFieldsPanelOpen, setIsFieldsPanelOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [visibleAdditionalFields, setVisibleAdditionalFields] = useState<AdditionalFieldKey[]>([]);
  const [orderedColumnIds, setOrderedColumnIds] = useState<PersonColumnId[]>(DEFAULT_ORDERED_COLUMN_IDS);

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

  const filteredAdditionalFieldOptions = useMemo(
    () =>
      additionalFieldOptions.filter((option) =>
        option.label.toLowerCase().includes(fieldSearch.trim().toLowerCase())
      ),
    [fieldSearch]
  );

  const tableColumns = useMemo<Array<{ id?: string; label: ReactNode; sortKey?: SortableColumn; draggable?: boolean }>>(
    () => [
      ...orderedColumnIds.map((columnId) => {
        if (columnId === "fullName") return { id: columnId, label: "Nome", sortKey: "fullName" as SortableColumn };
        if (columnId === "email") return { id: columnId, label: "E-mail" };
        if (columnId === "documentNumber") return { id: columnId, label: "Documento", sortKey: "documentNumber" as SortableColumn };
        if (columnId === "primaryPhone") return { id: columnId, label: "Telefone", sortKey: "primaryPhone" as SortableColumn };
        if (columnId === "status") return { id: columnId, label: "Status", sortKey: "status" as SortableColumn };
        if (columnId === "createdAt") return { id: columnId, label: "Criado em", sortKey: "createdAt" as SortableColumn };
        if (columnId === "action") return { id: columnId, label: "Acao" };

        const additionalFieldKey = columnId.replace("extra:", "") as AdditionalFieldKey;
        return {
          id: columnId,
          label: additionalFieldOptions.find((option) => option.key === additionalFieldKey)?.label ?? additionalFieldKey
        };
      }),
      {
        id: "add-column-control",
        draggable: false,
        label: (
          <div className="flex justify-center">
            <button
              aria-label="Abrir painel para adicionar campos"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-base font-semibold leading-none text-[var(--color-foreground)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => setIsFieldsPanelOpen(true)}
              type="button"
            >
              +
            </button>
          </div>
        )
      }
    ],
    [orderedColumnIds]
  );

  useEffect(() => {
    const extraIds = visibleAdditionalFields.map((field) => `extra:${field}` as PersonColumnId);

    setOrderedColumnIds((current) => {
      const withoutRemovedExtras = current.filter(
        (columnId) => !columnId.startsWith("extra:") || extraIds.includes(columnId as PersonColumnId)
      );
      const missingExtras = extraIds.filter((extraId) => !withoutRemovedExtras.includes(extraId));
      if (!missingExtras.length && withoutRemovedExtras.length === current.length) {
        return current;
      }

      const actionIndex = withoutRemovedExtras.indexOf("action");
      if (actionIndex < 0) {
        return [...withoutRemovedExtras, ...missingExtras];
      }

      const head = withoutRemovedExtras.slice(0, actionIndex);
      const tail = withoutRemovedExtras.slice(actionIndex);
      return [...head, ...missingExtras, ...tail];
    });
  }, [visibleAdditionalFields]);

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

  function toDateOnly(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR");
  }

  function toTimeOnly(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString("pt-BR");
  }

  function addAdditionalField(field: AdditionalFieldKey) {
    setVisibleAdditionalFields((current) => (current.includes(field) ? current : [...current, field]));
  }

  function renderAdditionalFieldValue(person: PersonNode, field: AdditionalFieldKey) {
    if (field === "id") return person.id;
    if (field === "createdDate") return toDateOnly(person.createdAt);
    return toTimeOnly(person.createdAt);
  }

  function renderColumnCell(person: PersonNode, columnId: PersonColumnId, cellKey: string) {
    if (columnId === "fullName") return <td className="px-3 py-2.5" key={cellKey}>{person.fullName}</td>;
    if (columnId === "email") return <td className="px-3 py-2.5" key={cellKey}>{person.email ?? "-"}</td>;
    if (columnId === "documentNumber") return <td className="px-3 py-2.5" key={cellKey}>{person.documentNumber ?? "-"}</td>;
    if (columnId === "primaryPhone") return <td className="px-3 py-2.5" key={cellKey}>{person.primaryPhone ?? "-"}</td>;
    if (columnId === "status") {
      return (
        <td className="px-3 py-2.5" key={cellKey}>
          <Badge variant={person.status === "ACTIVE" ? "success" : "attention"}>{toStatusLabel(person.status)}</Badge>
        </td>
      );
    }
    if (columnId === "createdAt") return <td className="px-3 py-2.5" key={cellKey}>{toDateTime(person.createdAt)}</td>;
    if (columnId === "action") {
      return (
        <td className="px-3 py-2.5" key={cellKey}>
          <Button onClick={() => openEditPerson(person)} size="sm" variant="outline">
            Editar
          </Button>
        </td>
      );
    }

    const additionalFieldKey = columnId.replace("extra:", "") as AdditionalFieldKey;
    return (
      <td className={additionalFieldKey === "id" ? "px-3 py-2.5 font-mono text-xs" : "px-3 py-2.5"} key={cellKey}>
        {renderAdditionalFieldValue(person, additionalFieldKey)}
      </td>
    );
  }

  function handleReorderColumns(sourceColumnId: string, targetColumnId: string) {
    const source = sourceColumnId as PersonColumnId;
    const target = targetColumnId as PersonColumnId;

    setOrderedColumnIds((current) => {
      const sourceIndex = current.indexOf(source);
      const targetIndex = current.indexOf(target);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current;

      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      const adjustedTargetIndex = next.indexOf(target);
      next.splice(adjustedTargetIndex, 0, moved);
      return next;
    });
  }

  return (
    <div className="relative space-y-6 overflow-hidden">
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
          compact
          emptyText={emptyText}
          isLoading={isLoading}
          loadingText={loadingText}
          onNextPage={() => {
            setCursorMode("forward");
            setRequestBefore(null);
            setRequestAfter(pageEndCursor);
          }}
          onReorderColumns={handleReorderColumns}
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
              {orderedColumnIds.map((columnId) => renderColumnCell(person, columnId, `${person.id}-${columnId}`))}
              <td className="px-3 py-2.5" />
            </tr>
          )}
          renderSortIcon={renderSortIcon}
          rows={rows}
          sortBy={sortBy}
          totalText={totalText(totalCount)}
        />
      </section>

      <button
        aria-label="Fechar painel de campos"
        className={`fixed inset-0 z-40 bg-slate-950/38 transition-opacity duration-300 ${
          isFieldsPanelOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsFieldsPanelOpen(false)}
        type="button"
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl transition-transform duration-300 ease-[var(--ease-standard)] ${
          isFieldsPanelOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Campos</h3>
              <p className="text-sm text-[var(--color-muted-foreground)]">Adicione mais campos na visualizacao.</p>
            </div>
            <button
              aria-label="Fechar painel"
              className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
              onClick={() => setIsFieldsPanelOpen(false)}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <Input
              onChange={(event) => setFieldSearch(event.target.value)}
              placeholder="Pesquise campos novos ou existentes"
              value={fieldSearch}
            />
          </div>

          <div className="flex-1 space-y-2 overflow-auto px-3 py-3">
            {filteredAdditionalFieldOptions.length ? (
              filteredAdditionalFieldOptions.map((option) => {
                const isAdded = visibleAdditionalFields.includes(option.key);

                return (
                  <div
                    className="flex items-center justify-between rounded-[var(--radius-md)] border border-transparent px-3 py-3 transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                    key={option.key}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--color-foreground)]">{option.label}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{option.description}</p>
                    </div>
                    <Button
                      disabled={isAdded}
                      onClick={() => addAdditionalField(option.key)}
                      size="sm"
                      variant={isAdded ? "outline" : "secondary"}
                    >
                      {isAdded ? "Adicionado" : "Adicionar"}
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="px-2 py-4 text-sm text-[var(--color-muted-foreground)]">
                Nenhum campo encontrado para esse filtro.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

