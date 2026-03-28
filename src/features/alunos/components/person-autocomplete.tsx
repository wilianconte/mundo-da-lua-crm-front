"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPeople, type MockPerson } from "@/features/alunos/api/student-mock-service";
import { cn } from "@/lib/utils/cn";

type PersonAutocompleteProps = {
  label?: string;
  value: MockPerson | null;
  onSelect: (person: MockPerson) => void;
  onOpenModal: () => void;
  onCreateNew?: (query: string) => void;
  placeholder?: string;
  excludedPersonIds?: string[];
};

export function PersonAutocomplete({
  label,
  value,
  onSelect,
  onOpenModal,
  onCreateNew,
  placeholder = "Pesquisar por nome, documento ou telefone",
  excludedPersonIds = []
}: PersonAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MockPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const excludedPersonIdsKey = excludedPersonIds.join("|");

  useEffect(() => {
    let active = true;

    if (!query.trim()) {
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    const selectedLabel = value?.fullName?.trim().toLowerCase();
    if (selectedLabel && query.trim().toLowerCase() === selectedLabel) {
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    const loadingId = window.setTimeout(() => setIsLoading(true), 0);
    const timeoutId = window.setTimeout(() => {
      searchPeople({ query }).then((response) => {
        if (!active) return;
        setResults(response.filter((person) => !excludedPersonIds.includes(person.id)));
        setHighlightedIndex(0);
        setIsOpen(true);
        setIsLoading(false);
      });
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(loadingId);
      window.clearTimeout(timeoutId);
    };
  }, [query, excludedPersonIdsKey, value?.fullName]);

  useEffect(() => {
    if (!value) {
      setQuery("");
      return;
    }

    setQuery(value.fullName);
  }, [value]);

  function commitSelection(person: MockPerson) {
    onSelect(person);
    setQuery(person.fullName);
    setIsOpen(false);
  }

  function handleCreateNew() {
    const nextQuery = query.trim();
    if (!nextQuery || !onCreateNew) return;
    setIsOpen(false);
    onCreateNew(nextQuery);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || !results.length) {
      if (event.key === "ArrowDown") setIsOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => (current - 1 + results.length) % results.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const person = results[highlightedIndex];
      if (person) commitSelection(person);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="space-y-2" ref={rootRef}>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Input
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (!nextQuery.trim()) {
                setResults([]);
                setIsOpen(false);
                setIsLoading(false);
              }
            }}
            onFocus={() => query && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            value={query}
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </div>

          {isOpen ? (
            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
              {results.length ? (
                results.map((person, index) => (
                  <button
                    className={cn(
                      "flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-[var(--color-surface-muted)]",
                      index === highlightedIndex && "bg-[var(--color-surface-muted)]"
                    )}
                    key={person.id}
                    onClick={() => commitSelection(person)}
                    type="button"
                  >
                    <span className="font-medium text-[var(--color-foreground)]">{person.fullName}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {person.documentNumber} - {person.phone} - {person.email}
                    </span>
                  </button>
                ))
              ) : (
                <div className="space-y-3 px-4 py-4">
                  <p className="text-sm text-[var(--color-muted-foreground)]">Nenhum resultado encontrado.</p>
                  {onCreateNew && query.trim() ? (
                    <Button onClick={handleCreateNew} size="sm" type="button" variant="outline">
                      Cadastrar nova pessoa
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
        <Button onClick={onOpenModal} variant="outline">
          Busca avancada
        </Button>
      </div>
    </div>
  );
}
