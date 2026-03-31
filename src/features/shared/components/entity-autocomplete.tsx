"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

type EntityAutocompleteProps<T> = {
  createNewLabel?: string;
  emptyMessage?: string;
  excludedIds?: string[];
  getDescription?: (item: T) => string;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  onCreateNew?: (query: string) => void;
  onOpenModal: () => void;
  onSearchErrorMessage?: string;
  onSelect: (item: T) => void;
  placeholder?: string;
  search: (input: { query: string }) => Promise<T[]>;
  value: T | null;
};

export function EntityAutocomplete<T>({
  createNewLabel = "Cadastrar novo",
  emptyMessage = "Nenhum resultado encontrado.",
  excludedIds = [],
  getDescription,
  getId,
  getLabel,
  onCreateNew,
  onOpenModal,
  onSearchErrorMessage = "Nao foi possivel carregar resultados agora.",
  onSelect,
  placeholder = "Pesquisar",
  search,
  value
}: EntityAutocompleteProps<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const excludedIdSet = useMemo(() => new Set(excludedIds), [excludedIds]);

  useEffect(() => {
    let active = true;

    if (!query.trim()) {
      setIsLoading(false);
      setIsOpen(false);
      setErrorMessage(null);
      return;
    }

    const selectedLabel = value ? getLabel(value).trim().toLowerCase() : null;
    if (selectedLabel && query.trim().toLowerCase() === selectedLabel) {
      setIsLoading(false);
      setIsOpen(false);
      setErrorMessage(null);
      return;
    }

    const loadingId = window.setTimeout(() => setIsLoading(true), 0);
    const timeoutId = window.setTimeout(() => {
      setErrorMessage(null);
      search({ query })
        .then((response) => {
          if (!active) return;
          setResults(response.filter((item) => !excludedIdSet.has(getId(item))));
          setHighlightedIndex(0);
          setIsOpen(true);
        })
        .catch(() => {
          if (!active) return;
          setResults([]);
          setHighlightedIndex(0);
          setIsOpen(true);
          setErrorMessage(onSearchErrorMessage);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(loadingId);
      window.clearTimeout(timeoutId);
    };
  }, [query, excludedIdSet, value, getId, getLabel, onSearchErrorMessage, search]);

  useEffect(() => {
    if (!value) {
      setQuery("");
      return;
    }

    setQuery(getLabel(value));
  }, [getLabel, value]);

  function commitSelection(item: T) {
    onSelect(item);
    setQuery(getLabel(item));
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
      const item = results[highlightedIndex];
      if (item) commitSelection(item);
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
                setErrorMessage(null);
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
              {errorMessage ? (
                <div className="px-4 py-4">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              ) : results.length ? (
                results.map((item, index) => (
                  <button
                    className={cn(
                      "flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-[var(--color-surface-muted)]",
                      index === highlightedIndex && "bg-[var(--color-surface-muted)]"
                    )}
                    key={getId(item)}
                    onClick={() => commitSelection(item)}
                    type="button"
                  >
                    <span className="font-medium text-[var(--color-foreground)]">{getLabel(item)}</span>
                    {getDescription ? (
                      <span className="text-xs text-[var(--color-muted-foreground)]">{getDescription(item)}</span>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="space-y-3 px-4 py-4">
                  <p className="text-sm text-[var(--color-muted-foreground)]">{emptyMessage}</p>
                  {onCreateNew && query.trim() ? (
                    <Button onClick={handleCreateNew} size="sm" type="button" variant="outline">
                      {createNewLabel}
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
