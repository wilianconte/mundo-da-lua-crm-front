"use client";

import { useState, type KeyboardEvent, type RefObject } from "react";

import type { TokenizedFilterChip, TokenizedFilterField } from "@/features/shared/components/tokenized-search-filters";

type UseTokenizedSearchOptions<TOperator extends string> = {
  textOperator: TOperator;
  categoryOperator: TOperator;
  triggerCharacter?: string;
  onFiltersChanged?: () => void;
};

type UseTokenizedSearchResult<
  TField extends TokenizedFilterField,
  TOperator extends string
> = {
  searchInput: string;
  freeQuery: string;
  selectedField: TField | null;
  selectedOperator: TOperator;
  chips: Array<TokenizedFilterChip<TField, TOperator>>;
  isFieldDropdownOpen: boolean;
  setSelectedOperator: (operator: TOperator) => void;
  openFieldDropdown: () => void;
  selectField: (field: TField, inputRef?: RefObject<HTMLInputElement | null>) => void;
  clearSelectedField: (inputRef?: RefObject<HTMLInputElement | null>) => void;
  handleInputChange: (value: string) => void;
  handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  addChip: () => void;
  removeChip: (id: string) => void;
};

export function useTokenizedSearch<
  TField extends TokenizedFilterField,
  TOperator extends string
>({
  textOperator,
  categoryOperator,
  triggerCharacter = "@",
  onFiltersChanged
}: UseTokenizedSearchOptions<TOperator>): UseTokenizedSearchResult<TField, TOperator> {
  const [searchInput, setSearchInput] = useState("");
  const [freeQuery, setFreeQuery] = useState("");
  const [selectedField, setSelectedField] = useState<TField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<TOperator>(textOperator);
  const [chips, setChips] = useState<Array<TokenizedFilterChip<TField, TOperator>>>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);

  function openFieldDropdown() {
    setIsFieldDropdownOpen(true);
  }

  function selectField(field: TField, inputRef?: RefObject<HTMLInputElement | null>) {
    setSelectedField(field);
    setSelectedOperator(field.type === "category" ? categoryOperator : textOperator);
    setIsFieldDropdownOpen(false);
    setSearchInput("");
    setFreeQuery("");
    inputRef?.current?.focus();
  }

  function clearSelectedField(inputRef?: RefObject<HTMLInputElement | null>) {
    setSelectedField(null);
    setSearchInput("");
    inputRef?.current?.focus();
  }

  function addChip() {
    if (!selectedField) return;
    const value = searchInput.trim();
    if (!value) return;

    const chip: TokenizedFilterChip<TField, TOperator> = {
      id: `${selectedField.key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      field: selectedField,
      operator: selectedOperator,
      value
    };

    setChips((current) => [...current, chip]);
    setSearchInput("");
    setIsFieldDropdownOpen(false);
    onFiltersChanged?.();
  }

  function handleInputChange(value: string) {
    setSearchInput(value);

    if (selectedField) return;

    if (value.includes(triggerCharacter)) {
      setIsFieldDropdownOpen(true);
      setFreeQuery("");
      return;
    }

    setIsFieldDropdownOpen(false);
    setFreeQuery(value);
    onFiltersChanged?.();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!selectedField) return;
    if (event.key !== "Enter" && event.key !== "Tab") return;

    event.preventDefault();
    addChip();
  }

  function removeChip(id: string) {
    setChips((current) => current.filter((chip) => chip.id !== id));
    onFiltersChanged?.();
  }

  return {
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
  };
}
