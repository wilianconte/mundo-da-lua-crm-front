"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  searchStudents,
  type StudentListItem,
  type StudentStatus
} from "@/features/alunos/api/student-mock-service";
import { SearchResultsTable } from "@/features/shared/components/search-results-table";
import { TokenizedSearchFilters } from "@/features/shared/components/tokenized-search-filters";

type FilterFieldKey =
  | "studentName"
  | "documentNumber"
  | "guardianName"
  | "registrationNumber"
  | "school"
  | "gradeClass"
  | "status";
type FieldType = "text" | "category";
type TextOperator = "contains" | "equals" | "startsWith";
type CategoryOperator = "equals" | "notEquals";
type FilterOperator = TextOperator | CategoryOperator;
type SortableColumn =
  | "studentName"
  | "registrationNumber"
  | "school"
  | "gradeClass"
  | "status"
  | "primaryGuardianName";
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

const filterFields: FilterField[] = [
  { key: "studentName", label: "Aluno", type: "text" },
  { key: "documentNumber", label: "Documento", type: "text" },
  { key: "guardianName", label: "Responsavel", type: "text" },
  { key: "registrationNumber", label: "Matricula", type: "text" },
  { key: "school", label: "Escola", type: "text" },
  { key: "gradeClass", label: "Turma", type: "text" },
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
  { label: "Aluno", sortKey: "studentName" },
  { label: "Matricula", sortKey: "registrationNumber" },
  { label: "Escola", sortKey: "school" },
  { label: "Turma", sortKey: "gradeClass" },
  { label: "Status", sortKey: "status" },
  { label: "Responsavel", sortKey: "primaryGuardianName" },
  { label: "Contato" },
  { label: "Acao" }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toStatusEnum(value: string): StudentStatus | null {
  const normalized = normalize(value);
  if (normalized === "active" || normalized === "ativo") return "ACTIVE";
  if (normalized === "pending" || normalized === "pendente") return "PENDING";
  if (normalized === "inactive" || normalized === "inativo") return "INACTIVE";
  return null;
}

function toStatusLabel(status: StudentStatus) {
  if (status === "ACTIVE") return "Ativo";
  if (status === "PENDING") return "Pendente";
  return "Inativo";
}

function matchesTextOperator(value: string, query: string, operator: TextOperator) {
  const normalizedValue = normalize(value);
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  if (operator === "equals") return normalizedValue === normalizedQuery;
  if (operator === "startsWith") return normalizedValue.startsWith(normalizedQuery);
  return normalizedValue.includes(normalizedQuery);
}

function getFilterValue(row: StudentListItem, key: FilterFieldKey) {
  if (key === "studentName") return row.studentName;
  if (key === "documentNumber") return row.documentNumber;
  if (key === "guardianName") return row.primaryGuardianName;
  if (key === "registrationNumber") return row.registrationNumber;
  if (key === "school") return row.school;
  if (key === "gradeClass") return row.gradeClass;
  return row.status;
}

export function StudentSearchView() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [freeQuery, setFreeQuery] = useState("");
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("contains");
  const [chips, setChips] = useState<FilterChip[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [rows, setRows] = useState<StudentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortableColumn>("studentName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const availableOperators = selectedField?.type === "category" ? categoryOperators : textOperators;

  useEffect(() => {
    let active = true;

    async function loadStudents() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await searchStudents({});
        if (!active) return;
        setRows(response);
      } catch {
        if (!active) return;
        setRows([]);
        setErrorMessage("Nao foi possivel carregar a pesquisa de alunos.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadStudents();

    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const freeQueryValue = normalize(freeQuery);

    return rows.filter((row) => {
      const matchesFreeQuery =
        !freeQueryValue ||
        [
          row.studentName,
          row.documentNumber,
          row.registrationNumber,
          row.school,
          row.gradeClass,
          row.primaryGuardianName
        ]
          .map((value) => normalize(value))
          .some((value) => value.includes(freeQueryValue));

      if (!matchesFreeQuery) return false;

      for (const chip of chips) {
        if (chip.field.key === "status") {
          const status = toStatusEnum(chip.value);
          if (!status) return false;

          const isEqual = row.status === status;
          if (chip.operator === "notEquals" && isEqual) return false;
          if (chip.operator === "equals" && !isEqual) return false;
          continue;
        }

        const value = chip.value.trim();
        if (!value) continue;
        const rowValue = getFilterValue(row, chip.field.key);
        const operator = chip.operator as TextOperator;
        if (!matchesTextOperator(String(rowValue), value, operator)) return false;
      }

      return true;
    });
  }, [chips, freeQuery, rows]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((left, right) => {
      const leftValue = normalize(String(left[sortBy]));
      const rightValue = normalize(String(right[sortBy]));
      const comparison = leftValue.localeCompare(rightValue);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredRows, sortBy, sortDirection]);

  function toggleSort(column: SortableColumn) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection("asc");
      return;
    }

    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
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
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!selectedField) return;
    if (event.key !== "Enter" && event.key !== "Tab") return;

    event.preventDefault();
    addChip();
  }

  function removeChip(id: string) {
    setChips((current) => current.filter((chip) => chip.id !== id));
  }

  function getOperatorLabel(operator: FilterOperator) {
    return (
      [...textOperators, ...categoryOperators].find((item) => item.key === operator)?.label ?? operator
    );
  }

  function statusBadgeVariant(status: StudentStatus): "success" | "attention" | "neutral" {
    if (status === "ACTIVE") return "success";
    if (status === "PENDING") return "attention";
    return "neutral";
  }

  function openEditStudent(student: StudentListItem) {
    const params = new URLSearchParams({
      mode: "edit",
      id: student.id
    });

    router.push(`/alunos/cadastro?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">Alunos</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Pesquisa de alunos</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Omnisearch com filtros tokenizados e busca livre global por aluno, documento e matricula.
            </p>
          </div>
          <Button
            className="min-w-40"
            leadingIcon={<Plus className="size-4" />}
            onClick={() => router.push("/alunos/cadastro")}
          >
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
          canGoNext={false}
          canGoPrevious={false}
          columns={tableColumns}
          emptyText="Nenhum aluno encontrado com os filtros atuais."
          isLoading={isLoading}
          loadingText="Carregando alunos..."
          onNextPage={() => undefined}
          onPreviousPage={() => undefined}
          onToggleSort={toggleSort}
          renderRow={(student) => (
            <tr
              className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-muted)]"
              key={student.id}
            >
              <td className="px-4 py-3">{student.studentName}</td>
              <td className="px-4 py-3">{student.registrationNumber}</td>
              <td className="px-4 py-3">{student.school}</td>
              <td className="px-4 py-3">{student.gradeClass}</td>
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
          rows={sortedRows}
          sortBy={sortBy}
          totalText={`${sortedRows.length} alunos encontrados com os filtros atuais.`}
        />
      </section>
    </div>
  );
}
