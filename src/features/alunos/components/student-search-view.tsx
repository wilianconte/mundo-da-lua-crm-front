"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  searchStudents,
  type GetStudentsVariables,
  type StudentFilterInput,
  type StudentStatus
} from "@/features/alunos/api/student-mock-service";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import {
  getPeople,
  type GetPeopleVariables,
  type PersonFilterInput
} from "@/features/pessoas/api/get-people";
import { SearchResultsTable } from "@/features/shared/components/search-results-table";
import { TokenizedSearchFilters } from "@/features/shared/components/tokenized-search-filters";
import { GraphQLRequestError } from "@/lib/graphql/client";

type FilterFieldKey =
  | "studentName"
  | "documentNumber"
  | "status";
type FieldType = "text" | "category";
type TextOperator = "contains" | "equals" | "startsWith";
type CategoryOperator = "equals" | "notEquals";
type FilterOperator = TextOperator | CategoryOperator;
type SortableColumn = "status" | "createdAt";
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

type StudentRow = Awaited<ReturnType<typeof searchStudents>>["nodes"][number];

const PAGE_SIZE = 20;

const filterFields: FilterField[] = [
  { key: "studentName", label: "Aluno", type: "text" },
  { key: "documentNumber", label: "Documento", type: "text" },
  { key: "status", label: "Status", type: "category" }
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
  { label: "Aluno" },
  { label: "Status", sortKey: "status" },
  { label: "Responsavel" },
  { label: "Contato" },
  { label: "Acao" }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toStatusEnum(value: string): StudentStatus | null {
  const normalized = normalize(value);
  if (normalized === "active" || normalized === "ativo") return "Active";
  if (normalized === "inactive" || normalized === "inativo") return "Inactive";
  if (normalized === "graduated" || normalized === "formado") return "Graduated";
  if (normalized === "transferred" || normalized === "transferido") return "Transferred";
  if (normalized === "suspended" || normalized === "suspenso") return "Suspended";
  return null;
}

function toStatusLabel(status: StudentStatus) {
  if (status === "Active") return "Ativo";
  if (status === "Inactive") return "Inativo";
  if (status === "Graduated") return "Formado";
  if (status === "Transferred") return "Transferido";
  return "Suspenso";
}

function statusBadgeVariant(status: StudentStatus): "success" | "attention" | "neutral" {
  if (status === "Active" || status === "Graduated") return "success";
  if (status === "Transferred" || status === "Suspended") return "attention";
  return "neutral";
}

function mapSortColumn(column: SortableColumn) {
  if (column === "status") return "status";
  return "createdAt";
}

function mapTextOperator(operator: TextOperator): "contains" | "eq" | "startsWith" {
  if (operator === "equals") return "eq";
  if (operator === "startsWith") return "startsWith";
  return "contains";
}

function mergeAndFilters(filters: StudentFilterInput[]) {
  if (!filters.length) return null;
  if (filters.length === 1) return filters[0];
  return { and: filters };
}

async function searchPeopleIdsByFilter(where: PersonFilterInput) {
  const variables: GetPeopleVariables = {
    first: 200,
    where,
    order: [{ fullName: "ASC" }]
  };

  const people = await getPeople(variables);
  return people.nodes.map((person) => person.id);
}

async function buildStudentWhere({
  chips,
  freeQuery
}: {
  chips: FilterChip[];
  freeQuery: string;
}): Promise<{ where: StudentFilterInput | null; forceEmpty: boolean }> {
  const andFilters: StudentFilterInput[] = [];
  const freeQueryValue = freeQuery.trim();

  if (freeQueryValue) {
    const personIdsFromQuery = await searchPeopleIdsByFilter({
      or: [
        { fullName: { contains: freeQueryValue } },
        { documentNumber: { contains: freeQueryValue } }
      ]
    }).catch(() => []);

    if (!personIdsFromQuery.length) {
      return { where: null, forceEmpty: true };
    }

    andFilters.push({ personId: { in: personIdsFromQuery } });
  }

  for (const chip of chips) {
    const value = chip.value.trim();
    if (!value) continue;

    if (chip.field.key === "status") {
      const status = toStatusEnum(value);
      if (!status) continue;
      if (chip.operator === "equals") {
        andFilters.push({ status: { eq: status } });
      } else {
        const allStatuses: StudentStatus[] = ["Active", "Inactive", "Graduated", "Transferred", "Suspended"];
        andFilters.push({
          or: allStatuses
            .filter((item) => item !== status)
            .map((item) => ({ status: { eq: item } }))
        });
      }
      continue;
    }

    if (chip.field.key === "studentName" || chip.field.key === "documentNumber") {
      const personWhere: PersonFilterInput =
        chip.field.key === "studentName"
          ? { fullName: { [mapTextOperator(chip.operator as TextOperator)]: value } }
          : { documentNumber: { [mapTextOperator(chip.operator as TextOperator)]: value } };

      const personIds = await searchPeopleIdsByFilter(personWhere).catch(() => []);
      if (!personIds.length) {
        return { where: null, forceEmpty: true };
      }
      andFilters.push({ personId: { in: personIds } });
      continue;
    }

    const operator = mapTextOperator(chip.operator as TextOperator);
    const personWhere: PersonFilterInput =
      chip.field.key === "studentName"
        ? { fullName: { [operator]: value } }
        : { documentNumber: { [operator]: value } };
    const personIds = await searchPeopleIdsByFilter(personWhere).catch(() => []);
    if (!personIds.length) {
      return { where: null, forceEmpty: true };
    }
    andFilters.push({ personId: { in: personIds } });
  }

  return { where: mergeAndFilters(andFilters), forceEmpty: false };
}

export function StudentSearchView() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [freeQuery, setFreeQuery] = useState("");
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("contains");
  const [chips, setChips] = useState<FilterChip[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortableColumn>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [rows, setRows] = useState<StudentRow[]>([]);
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

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const whereResult = await buildStudentWhere({ chips, freeQuery });
        if (!isMounted) return;

        if (whereResult.forceEmpty) {
          setRows([]);
          setTotalCount(0);
          setHasNextPage(false);
          setHasPreviousPage(false);
          setPageStartCursor(null);
          setPageEndCursor(null);
          return;
        }

        const variables: GetStudentsVariables = {
          where: whereResult.where,
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

        const response = await searchStudents(variables);
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
            : "Nao foi possivel carregar a pesquisa de alunos.";
        setRows([]);
        setTotalCount(0);
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, [chips, freeQuery, sortBy, sortDirection, cursorMode, requestAfter, requestBefore]);

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

  function openEditStudent(student: StudentRow) {
    const params = new URLSearchParams({
      mode: "edit",
      id: student.id
    });

    router.push(`/alunos/cadastro?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <FeatureViewHeader
          actions={
            <Button
              className="min-w-40"
              leadingIcon={<Plus className="size-4" />}
              onClick={() => router.push("/alunos/cadastro")}
            >
              Adicionar
            </Button>
          }
          backAriaLabel="Voltar para o dashboard"
          backHref="/"
          description="Omnisearch com filtros tokenizados e busca por aluno, documento e status."
          title="Pesquisa de alunos"
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
          emptyText="Nenhum aluno encontrado com os filtros atuais."
          isLoading={isLoading}
          loadingText="Carregando alunos..."
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
          renderRow={(student) => (
            <tr
              className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-muted)]"
              key={student.id}
            >
              <td className="px-4 py-3">{student.studentName}</td>
              <td className="px-4 py-3">
                <Badge variant={statusBadgeVariant(student.status)}>{toStatusLabel(student.status)}</Badge>
              </td>
              <td className="px-4 py-3">{student.primaryGuardianName}</td>
              <td className="px-4 py-3">{student.primaryGuardianPhone}</td>
              <td className="px-4 py-3">
                <Button onClick={() => openEditStudent(student)} size="sm" variant="outline">
                  Editar
                </Button>
              </td>
            </tr>
          )}
          renderSortIcon={renderSortIcon}
          rows={rows}
          sortBy={sortBy}
          totalText={`${totalCount} alunos encontrados com os filtros atuais.`}
        />
      </section>
    </div>
  );
}
