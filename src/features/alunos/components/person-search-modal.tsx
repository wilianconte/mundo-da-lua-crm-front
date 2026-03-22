"use client";

import { Loader2, Search, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Field, FieldLabel } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { searchPeople, type MockPerson, type PersonSearchFilters } from "@/features/alunos/api/student-mock-service";

const initialFilters: PersonSearchFilters = {
  fullName: "",
  documentNumber: "",
  phone: "",
  email: ""
};

type PersonSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (person: MockPerson) => void;
  title?: string;
};

export function PersonSearchModal({ open, onClose, onSelect, title = "Search Person" }: PersonSearchModalProps) {
  const [filters, setFilters] = useState<PersonSearchFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MockPerson[]>([]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    const loadingId = window.setTimeout(() => setIsLoading(true), 0);
    searchPeople(initialFilters)
      .then((response) => {
        if (!active) return;
        setResults(response);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(loadingId);
    };
  }, [open]);

  if (!open) return null;

  async function handleSearch() {
    setIsLoading(true);
    const response = await searchPeople(filters);
    setResults(response);
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <Card className="max-h-[90vh] w-full max-w-5xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Search mock people by name, document, phone, or email.
            </p>
          </div>
          <button
            aria-label="Close search person modal"
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <CardContent className="space-y-5 overflow-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { key: "fullName", label: "Name", placeholder: "Type the person name" },
              { key: "documentNumber", label: "Document", placeholder: "CPF or RG" },
              { key: "phone", label: "Phone", placeholder: "Phone number" },
              { key: "email", label: "Email", placeholder: "Email address" }
            ].map((field) => (
              <Field key={field.key}>
                <FieldLabel htmlFor={`person-filter-${field.key}`}>{field.label}</FieldLabel>
                <Input
                  id={`person-filter-${field.key}`}
                  onChange={(event) => setFilters((current) => ({ ...current, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                  value={String(filters[field.key as keyof PersonSearchFilters] ?? "")}
                />
              </Field>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button leadingIcon={isLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} onClick={handleSearch}>
              Search
            </Button>
            <Button
              onClick={() => {
                setFilters(initialFilters);
                void handleSearch();
              }}
              variant="outline"
            >
              Clear filters
            </Button>
            <Button disabled leadingIcon={<UserPlus className="size-4" />} variant="ghost">
              New person (coming soon)
            </Button>
          </div>

          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <table className="min-w-[760px] w-full border-collapse text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-left text-[var(--color-muted-foreground)]">
                <tr>
                  {['Name', 'Document', 'Phone', 'Email', 'Action'].map((label) => (
                    <th className="px-4 py-3 font-semibold" key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={5}>
                      Loading mock people...
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
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={5}>
                      No people found with the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
