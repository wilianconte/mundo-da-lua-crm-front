"use client";

import { Plus, Search, X } from "lucide-react";
import { type KeyboardEvent, type RefObject } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type TokenizedFilterField<TFieldKey extends string = string> = {
  key: TFieldKey;
  label: string;
  type: "text" | "category";
};

export type TokenizedFilterChip<
  TField extends TokenizedFilterField = TokenizedFilterField,
  TOperator extends string = string
> = {
  id: string;
  field: TField;
  operator: TOperator;
  value: string;
};

type OperatorOption<TOperator extends string> = {
  key: TOperator;
  label: string;
};

type TokenizedSearchFiltersProps<
  TField extends TokenizedFilterField,
  TOperator extends string
> = {
  selectedField: TField | null;
  selectedOperator: TOperator;
  availableOperators: Array<OperatorOption<TOperator>>;
  filterFields: TField[];
  chips: Array<TokenizedFilterChip<TField, TOperator>>;
  searchInput: string;
  isFieldDropdownOpen: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onOperatorChange: (operator: TOperator) => void;
  onClearSelectedField: () => void;
  onInputChange: (value: string) => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onOpenFieldDropdown: () => void;
  onFilterClick: () => void;
  onSelectField: (field: TField) => void;
  onRemoveChip: (id: string) => void;
  getOperatorLabel: (operator: TOperator) => string;
};

export function TokenizedSearchFilters<
  TField extends TokenizedFilterField,
  TOperator extends string
>({
  selectedField,
  selectedOperator,
  availableOperators,
  filterFields,
  chips,
  searchInput,
  isFieldDropdownOpen,
  inputRef,
  onOperatorChange,
  onClearSelectedField,
  onInputChange,
  onInputKeyDown,
  onOpenFieldDropdown,
  onFilterClick,
  onSelectField,
  onRemoveChip,
  getOperatorLabel
}: TokenizedSearchFiltersProps<TField, TOperator>) {
  return (
    <section className="space-y-5">
      <div className="space-y-3">
        {selectedField ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="attention">{selectedField.label}</Badge>
            <select
              aria-label="Operador logico"
              className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
              onChange={(event) => onOperatorChange(event.target.value as TOperator)}
              value={selectedOperator}
            >
              {availableOperators.map((operator) => (
                <option key={operator.key} value={operator.key}>
                  {operator.label}
                </option>
              ))}
            </select>
            <button
              className="text-xs font-medium text-[var(--color-muted-foreground)] underline-offset-2 hover:underline"
              onClick={onClearSelectedField}
              type="button"
            >
              trocar atributo
            </button>
          </div>
        ) : null}

        <div className="relative flex flex-wrap items-center gap-3">
          <div className="relative min-w-72 flex-1">
            <Input
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={
                selectedField
                  ? `Digite um valor para ${selectedField.label}`
                  : "Digite para busca livre ou use @ para filtrar"
              }
              ref={inputRef}
              value={searchInput}
            />
            <button
              aria-label="Adicionar filtro"
              className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
              onClick={onOpenFieldDropdown}
              type="button"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <Button leadingIcon={<Search className="size-4" />} onClick={onFilterClick}>
            Filtrar
          </Button>

          {isFieldDropdownOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.45rem)] z-20 w-52 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-soft)]">
              {filterFields.map((field) => (
                <button
                  className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-surface-muted)]"
                  key={field.key}
                  onClick={() => onSelectField(field)}
                  type="button"
                >
                  <span>{field.label}</span>
                  <span className="text-xs text-[var(--color-muted-foreground)]">@</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Finalize filtros com Enter/Tab para gerar chips.
          </p>
        </div>
      </div>

      {chips.length ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-foreground)]"
              key={chip.id}
            >
              {chip.field.label} {getOperatorLabel(chip.operator)} {chip.value}
              <button
                aria-label={`Remover filtro ${chip.field.label}`}
                className="inline-flex size-4 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-border)] hover:text-[var(--color-foreground)]"
                onClick={() => onRemoveChip(chip.id)}
                type="button"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
