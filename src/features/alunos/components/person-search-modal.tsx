"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { searchStudentPeople } from "@/features/alunos/api/search-student-people";
import { type MockPerson } from "@/features/alunos/api/student-mock-service";
import { TokenizedSearchFilters } from "@/features/shared/components/tokenized-search-filters";

type FilterFieldKey = "fullName" | "documentNumber" | "phone" | "email";
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
  { key: "fullName", label: "Nome", type: "text" },
  { key: "documentNumber", label: "Documento", type: "text" },
  { key: "phone", label: "Telefone", type: "text" },
  { key: "email", label: "Email", type: "text" }
];

const textOperators: Array<{ key: TextOperator; label: string }> = [
  { key: "contains", label: "contem" },
  { key: "equals", label: "e exatamente" },
  { key: "startsWith", label: "comeca com" }
];

type PersonSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (person: MockPerson) => void;
  title?: string;
};

export function PersonSearchModal({
  open,
  onClose,
  onSelect,
  title = "Pesquisar pessoa"
}: PersonSearchModalProps) {
  const [searchInput, setSearchInput] = useState("");
  const [freeQuery, setFreeQuery] = useState("");
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<TextOperator>("contains");
  const [chips, setChips] = useState<FilterChip[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MockPerson[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const availableOperators = useMemo(() => textOperators, []);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setIsLoading(true);
    setErrorMessage(null);

    searchStudentPeople({
      query: freeQuery,
      filters: chips.map((chip) => ({
        field: chip.field.key,
        operator: chip.operator,
        value: chip.value
      })),
      limit: 50
    })
      .then((response) => {
        if (!active) return;
        setResults(response);
      })
      .catch(() => {
        if (!active) return;
        setResults([]);
        setErrorMessage("Nao foi possivel carregar pessoas agora.");
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
              Omnisearch com filtros tokenizados e busca livre por nome, documento, telefone e email.
            </p>
          </div>
          <button
            aria-label="Fechar modal de pesquisa de pessoas"
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
                  {["Nome", "Documento", "Telefone", "Email", "Acao"].map((label) => (
                    <th className="px-4 py-3 font-semibold" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={5}>
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Carregando pessoas...
                      </span>
                    </td>
                  </tr>
                ) : results.length ? (
                  results.map((person) => (
                    <tr className="border-t border-[var(--color-border)]" key={person.id}>
                      <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">{person.fullName}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{person.documentNumber}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{person.phone}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{person.email}</td>
                      <td className="px-4 py-3">
                        <Button
                          onClick={() => {
                            onSelect(person);
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
                ) : errorMessage ? (
                  <tr className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-6 text-center text-red-600" colSpan={5}>
                      {errorMessage}
                    </td>
                  </tr>
                ) : (
                  <tr className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={5}>
                      Nenhuma pessoa encontrada com os filtros atuais.
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
