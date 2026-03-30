"use client";

import { ArrowDown, ArrowUp, Check, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { SearchResultsTable } from "@/features/shared/components/search-results-table";
import { TokenizedSearchFilters } from "@/features/shared/components/tokenized-search-filters";
import { GraphQLRequestError } from "@/lib/graphql/client";
import {
  getCourses,
  type CourseFilterInput,
  type CourseNode,
  type CourseStatus,
  type CourseType,
  type GetCoursesVariables
} from "../api/get-courses";

type FilterFieldKey = "name" | "code" | "type" | "status";
type FieldType = "text" | "category";
type TextOperator = "contains" | "equals" | "startsWith";
type CategoryOperator = "equals";
type FilterOperator = TextOperator | CategoryOperator;
type SortableColumn = "name" | "startDate" | "createdAt";
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

const PAGE_SIZE = 10;

const filterFields: FilterField[] = [
  { key: "name", label: "Nome", type: "text" },
  { key: "code", label: "Codigo", type: "text" },
  { key: "type", label: "Tipo", type: "category" },
  { key: "status", label: "Status", type: "category" }
];

const textOperators: Array<{ key: TextOperator; label: string }> = [
  { key: "contains", label: "contem" },
  { key: "equals", label: "e exatamente" },
  { key: "startsWith", label: "comeca com" }
];

const categoryOperators: Array<{ key: CategoryOperator; label: string }> = [{ key: "equals", label: "e igual a" }];

const tableColumns: Array<{ label: string; sortKey?: SortableColumn }> = [
  { label: "Nome", sortKey: "name" },
  { label: "Codigo" },
  { label: "Tipo" },
  { label: "Status" },
  { label: "Inicio", sortKey: "startDate" },
  { label: "Termino" },
  { label: "Vagas" },
  { label: "Ativo" },
  { label: "Acao" }
];

const courseTypeOptions: Array<{ value: CourseType; label: string }> = [
  { value: "AFTER_SCHOOL", label: "Reforco Escolar" },
  { value: "LANGUAGE", label: "Idiomas" },
  { value: "SCHOOL_CLASS", label: "Turma Regular" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "OTHER", label: "Outros" }
];

const courseStatusOptions: Array<{ value: CourseStatus; label: string }> = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
  { value: "COMPLETED", label: "Concluido" },
  { value: "CANCELLED", label: "Cancelado" }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toCourseTypeEnum(value: string): CourseType | null {
  const normalized = normalize(value).replace(/\s+/g, "_");
  const map: Record<string, CourseType> = {
    after_school: "AFTER_SCHOOL",
    reforco_escolar: "AFTER_SCHOOL",
    language: "LANGUAGE",
    idiomas: "LANGUAGE",
    school_class: "SCHOOL_CLASS",
    turma_regular: "SCHOOL_CLASS",
    workshop: "WORKSHOP",
    other: "OTHER",
    outros: "OTHER"
  };

  return map[normalized] ?? null;
}

function toCourseStatusEnum(value: string): CourseStatus | null {
  const normalized = normalize(value);
  if (normalized === "draft" || normalized === "rascunho") return "DRAFT";
  if (normalized === "active" || normalized === "ativo") return "ACTIVE";
  if (normalized === "inactive" || normalized === "inativo") return "INACTIVE";
  if (normalized === "completed" || normalized === "concluido") return "COMPLETED";
  if (normalized === "cancelled" || normalized === "cancelado") return "CANCELLED";
  return null;
}

function mapSortColumn(column: SortableColumn) {
  if (column === "name") return "name";
  if (column === "startDate") return "startDate";
  return "createdAt";
}

function mapTextOperator(operator: TextOperator): "contains" | "eq" | "startsWith" {
  if (operator === "equals") return "eq";
  if (operator === "startsWith") return "startsWith";
  return "contains";
}

function toTypeLabel(type: CourseType) {
  return courseTypeOptions.find((option) => option.value === type)?.label ?? type;
}

function toStatusLabel(status: CourseStatus) {
  return courseStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function toStatusBadge(status: CourseStatus) {
  if (status === "ACTIVE") return <Badge variant="success">{toStatusLabel(status)}</Badge>;
  if (status === "INACTIVE") return <Badge variant="attention">{toStatusLabel(status)}</Badge>;
  if (status === "DRAFT") return <Badge variant="neutral">{toStatusLabel(status)}</Badge>;
  if (status === "COMPLETED") {
    return (
      <Badge className="bg-sky-100 text-sky-700" variant="neutral">
        {toStatusLabel(status)}
      </Badge>
    );
  }

  return (
    <Badge className="bg-rose-100 text-rose-700" variant="neutral">
      {toStatusLabel(status)}
    </Badge>
  );
}

function toDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

export function CourseSearchView() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [freeQuery, setFreeQuery] = useState("");
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("contains");
  const [chips, setChips] = useState<FilterChip[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortableColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rows, setRows] = useState<CourseNode[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [afterCursor, setAfterCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const availableOperators = selectedField?.type === "category" ? categoryOperators : textOperators;

  const where = useMemo<CourseFilterInput | null>(() => {
    const nextWhere: CourseFilterInput = {};

    if (freeQuery.trim()) {
      nextWhere.or = [{ name: { contains: freeQuery.trim() } }, { code: { contains: freeQuery.trim() } }];
    }

    for (const chip of chips) {
      if (chip.field.key === "type") {
        const type = toCourseTypeEnum(chip.value);
        if (!type) continue;
        nextWhere.type = { eq: type };
        continue;
      }

      if (chip.field.key === "status") {
        const status = toCourseStatusEnum(chip.value);
        if (!status) continue;
        nextWhere.status = { eq: status };
        continue;
      }

      const key = chip.field.key;
      const value = chip.value.trim();
      if (!value) continue;

      const operator = mapTextOperator(chip.operator as TextOperator);
      nextWhere[key] = { [operator]: value };
    }

    return Object.keys(nextWhere).length ? nextWhere : null;
  }, [chips, freeQuery]);

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const variables: GetCoursesVariables = {
          first: PAGE_SIZE,
          after: afterCursor,
          where,
          order: [{ [mapSortColumn(sortBy)]: sortDirection === "asc" ? "ASC" : "DESC" }]
        };

        const response = await getCourses(variables);
        if (!isMounted) return;

        setRows(response.nodes ?? []);
        setTotalCount(response.totalCount ?? 0);
        setHasNextPage(Boolean(response.pageInfo?.hasNextPage));
        setEndCursor(response.pageInfo?.endCursor ?? null);
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof GraphQLRequestError
            ? error.message
            : "Ocorreu um erro inesperado. Tente novamente.";
        setRows([]);
        setTotalCount(0);
        setErrorMessage(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, [where, sortBy, sortDirection, afterCursor]);

  function resetToFirstPage() {
    setAfterCursor(null);
    setCursorHistory([]);
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

  const isEmpty = !isLoading && !rows.length && !errorMessage;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <FeatureViewHeader
          actions={
            <Button className="min-w-40" leadingIcon={<Plus className="size-4" />} onClick={() => router.push("/cursos/cadastro")}>
              Adicionar
            </Button>
          }
          backAriaLabel="Voltar para o dashboard"
          backHref="/"
          description="Omnisearch com filtros tokenizados e busca livre por nome e codigo."
          title="Pesquisa de cursos"
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

        {isEmpty ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-8 text-center">
            <p className="text-sm text-[var(--color-muted-foreground)]">Nenhum curso encontrado.</p>
            <Button className="mt-4" onClick={() => router.push("/cursos/cadastro")} size="sm">
              Criar primeiro curso
            </Button>
          </div>
        ) : (
          <SearchResultsTable
            canGoNext={!isLoading && hasNextPage && Boolean(endCursor)}
            canGoPrevious={!isLoading && cursorHistory.length > 0}
            columns={tableColumns}
            emptyText="Nenhum curso encontrado com os filtros atuais."
            isLoading={isLoading}
            loadingText="Carregando cursos..."
            onNextPage={() => {
              if (!endCursor) return;
              setCursorHistory((current) => [...current, afterCursor]);
              setAfterCursor(endCursor);
            }}
            onPreviousPage={() => {
              setCursorHistory((current) => {
                const next = [...current];
                const previousCursor = next.pop() ?? null;
                setAfterCursor(previousCursor);
                return next;
              });
            }}
            onToggleSort={toggleSort}
            renderRow={(course) => (
              <tr
                className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-muted)]"
                key={course.id}
              >
                <td className="px-4 py-3">{course.name}</td>
                <td className="px-4 py-3">{course.code ?? "-"}</td>
                <td className="px-4 py-3">{toTypeLabel(course.type)}</td>
                <td className="px-4 py-3">{toStatusBadge(course.status)}</td>
                <td className="px-4 py-3">{toDate(course.startDate)}</td>
                <td className="px-4 py-3">{toDate(course.endDate)}</td>
                <td className="px-4 py-3">{course.capacity ?? "-"}</td>
                <td className="px-4 py-3">
                  {course.isActive ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <X className="size-4 text-[var(--color-muted-foreground)]" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => router.push(`/cursos/cadastro?mode=edit&id=${course.id}`)}
                      size="sm"
                      variant="outline"
                    >
                      Editar
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            renderSortIcon={renderSortIcon}
            rows={rows}
            sortBy={sortBy}
            tableMinWidthClassName="min-w-[1120px]"
            totalText={`${totalCount} curso(s) encontrado(s).`}
          />
        )}
      </section>
    </div>
  );
}
