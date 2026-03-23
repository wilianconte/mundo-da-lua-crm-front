"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchCourses, type MockCourse } from "@/features/alunos/api/student-mock-service";
import { cn } from "@/lib/utils/cn";

type CourseAutocompleteProps = {
  value: MockCourse | null;
  onSelect: (course: MockCourse) => void;
  onOpenModal: () => void;
  placeholder?: string;
  excludedCourseIds?: string[];
};

export function CourseAutocomplete({
  value,
  onSelect,
  onOpenModal,
  placeholder = "Pesquisar por nome, codigo ou categoria",
  excludedCourseIds = []
}: CourseAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MockCourse[]>([]);
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

  const excludedCourseIdsKey = excludedCourseIds.join("|");

  useEffect(() => {
    let active = true;

    if (!query.trim()) {
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    const selectedLabel = value?.name?.trim().toLowerCase();
    if (selectedLabel && query.trim().toLowerCase() === selectedLabel) {
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    const loadingId = window.setTimeout(() => setIsLoading(true), 0);
    const timeoutId = window.setTimeout(() => {
      searchCourses({ query }).then((response) => {
        if (!active) return;
        setResults(response.filter((course) => !excludedCourseIds.includes(course.id)));
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
  }, [query, excludedCourseIdsKey, value?.name]);

  useEffect(() => {
    if (!value) {
      setQuery("");
      return;
    }

    setQuery(value.name);
  }, [value]);

  function commitSelection(course: MockCourse) {
    onSelect(course);
    setQuery(course.name);
    setIsOpen(false);
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
      const course = results[highlightedIndex];
      if (course) commitSelection(course);
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
                results.map((course, index) => (
                  <button
                    className={cn(
                      "flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-[var(--color-surface-muted)]",
                      index === highlightedIndex && "bg-[var(--color-surface-muted)]"
                    )}
                    key={course.id}
                    onClick={() => commitSelection(course)}
                    type="button"
                  >
                    <span className="font-medium text-[var(--color-foreground)]">{course.name}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {course.code} - {course.category}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-sm text-[var(--color-muted-foreground)]">
                  Nenhum curso encontrado.
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
