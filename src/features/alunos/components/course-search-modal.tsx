"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { searchCourses, type MockCourse } from "@/features/alunos/api/student-mock-service";
import { TokenizedSearchFilters } from "@/features/shared/components/tokenized-search-filters";

type FilterFieldKey = "name" | "code" | "category";
type TextOperator = "contains" | "equals" | "startsWith";

type FilterField = {
  key: FilterFieldKey;
  label: string;
  type: "text";
};

type FilterChip = {
  id: string;
  field: FilterField;
  operator: TextOperator;
  value: string;
};

const filterFields: FilterField[] = [
  { key: "name", label: "Nome", type: "text" },
  { key: "code", label: "Codigo", type: "text" },
  { key: "category", label: "Categoria", type: "text" }
];

const textOperators: Array<{ key: TextOperator; label: string }> = [
  { key: "contains", label: "contem" },
  { key: "equals", label: "e exatamente" },
  { key: "startsWith", label: "comeca com" }
];

type CourseSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (course: MockCourse) => void;
  title?: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesTextOperator(value: string, query: string, operator: TextOperator) {
  const normalizedValue = normalize(value);
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  if (operator === "equals") return normalizedValue === normalizedQuery;
  if (operator === "startsWith") return normalizedValue.startsWith(normalizedQuery);
  return normalizedValue.includes(normalizedQuery);
}

export function CourseSearchModal({
  open,
  onClose,
  onSelect,
  title = "Pesquisar curso"
}: CourseSearchModalProps) {
  const [searchInput, setSearchInput] = useState("");
  const [freeQuery, setFreeQuery] = useState("");
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<TextOperator>("contains");
  const [chips, setChips] = useState<FilterChip[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MockCourse[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const availableOperators = useMemo(() => textOperators, []);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setIsLoading(true);

    searchCourses({ query: freeQuery })
      .then((response) => {
        if (!active) return;

        const filtered = response.filter((course) => {
          return chips.every((chip) => {
            const value = chip.value.trim();
            if (!value) return true;
            const courseValue = String(course[chip.field.key] ?? "");
            return matchesTextOperator(courseValue, value, chip.operator);
          });
        });

        setResults(filtered);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [chips, freeQuery, open]);

  if (!open) return null;

  function openFieldDropdown() {
    setIsFieldDropdownOpen(true);
  }

  function selectField(field: FilterField) {
    setSelectedField(field);
    setSelectedOperator("contains");
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

  function getOperatorLabel(operator: TextOperator) {
    return textOperators.find((item) => item.key === operator)?.label ?? operator;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <Card className="max-h-[90vh] w-full max-w-5xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Omnisearch com filtros tokenizados e busca livre por nome, codigo e categoria.
            </p>
          </div>
          <button
            aria-label="Fechar modal de pesquisa de cursos"
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <CardContent className="space-y-5 overflow-auto p-6">
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

          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <table className="min-w-[760px] w-full border-collapse text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-left text-[var(--color-muted-foreground)]">
                <tr>
                  {["Nome", "Codigo", "Categoria", "Acao"].map((label) => (
                    <th className="px-4 py-3 font-semibold" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={4}>
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Carregando cursos...
                      </span>
                    </td>
                  </tr>
                ) : results.length ? (
                  results.map((course) => (
                    <tr className="border-t border-[var(--color-border)]" key={course.id}>
                      <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">{course.name}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{course.code}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{course.category}</td>
                      <td className="px-4 py-3">
                        <Button
                          onClick={() => {
                            onSelect(course);
                            onClose();
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Selecionar
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={4}>
                      Nenhum curso encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
