"use client";

import { useMemo, useState } from "react";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRelationshipLabel,
  guardianRelationshipOptions,
  type MockPerson,
  type StudentGuardian
} from "@/features/alunos/api/student-mock-service";
import { PersonAutocomplete } from "@/features/alunos/components/person-autocomplete";
import { PersonSearchModal } from "@/features/alunos/components/person-search-modal";

type GuardianDraft = {
  person: MockPerson | null;
  relationshipType: StudentGuardian["relationshipType"] | "";
  isPrimaryGuardian: boolean;
  isFinancialResponsible: boolean;
  receivesNotifications: boolean;
  canPickupChild: boolean;
  notes: string;
};

const initialDraft: GuardianDraft = {
  person: null,
  relationshipType: "",
  isPrimaryGuardian: false,
  isFinancialResponsible: false,
  receivesNotifications: true,
  canPickupChild: true,
  notes: ""
};

export function GuardiansEditor({
  guardians,
  onChange
}: {
  guardians: StudentGuardian[];
  onChange: (guardians: StudentGuardian[]) => void;
}) {
  const [draft, setDraft] = useState<GuardianDraft>(initialDraft);
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const excludedIds = useMemo(
    () => guardians.filter((guardian) => guardian.id !== editingGuardianId).map((guardian) => guardian.person.id),
    [editingGuardianId, guardians]
  );

  function resetDraft() {
    setDraft(initialDraft);
    setEditingGuardianId(null);
    setErrorMessage(null);
  }

  function handleSubmitDraft() {
    if (!draft.person) {
      setErrorMessage("Select a responsible person before adding.");
      return;
    }

    if (!draft.relationshipType) {
      setErrorMessage("Select the relationship type.");
      return;
    }

    if (guardians.some((guardian) => guardian.person.id === draft.person?.id && guardian.id !== editingGuardianId)) {
      setErrorMessage("This person is already linked as a guardian.");
      return;
    }

    const nextGuardian: StudentGuardian = {
      id: editingGuardianId ?? `guardian-draft-${Date.now()}`,
      person: draft.person,
      relationshipType: draft.relationshipType,
      isPrimaryGuardian: draft.isPrimaryGuardian,
      isFinancialResponsible: draft.isFinancialResponsible,
      receivesNotifications: draft.receivesNotifications,
      canPickupChild: draft.canPickupChild,
      notes: draft.notes.trim() || undefined
    };

    const mergedGuardians = editingGuardianId
      ? guardians.map((guardian) => (guardian.id === editingGuardianId ? nextGuardian : guardian))
      : [...guardians, nextGuardian];

    const normalizedGuardians = nextGuardian.isPrimaryGuardian
      ? mergedGuardians.map((guardian) => ({
          ...guardian,
          isPrimaryGuardian: guardian.id === nextGuardian.id
        }))
      : mergedGuardians;

    onChange(normalizedGuardians);
    resetDraft();
  }

  function handleEdit(guardian: StudentGuardian) {
    setDraft({
      person: guardian.person,
      relationshipType: guardian.relationshipType,
      isPrimaryGuardian: guardian.isPrimaryGuardian,
      isFinancialResponsible: guardian.isFinancialResponsible,
      receivesNotifications: guardian.receivesNotifications,
      canPickupChild: guardian.canPickupChild,
      notes: guardian.notes ?? ""
    });
    setEditingGuardianId(guardian.id);
    setErrorMessage(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add guardians</CardTitle>
          <CardDescription>
            Link one or more responsible people using the same person selection flow used in General Data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field>
            <FieldLabel>Responsible person</FieldLabel>
            <PersonAutocomplete
              excludedPersonIds={excludedIds}
              onOpenModal={() => setIsModalOpen(true)}
              onSelect={(person) => {
                setDraft((current) => ({ ...current, person }));
                setErrorMessage(null);
              }}
              value={draft.person}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="guardian-relationship-type">Relationship type</FieldLabel>
              <select
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                id="guardian-relationship-type"
                onChange={(event) => setDraft((current) => ({ ...current, relationshipType: event.target.value as StudentGuardian['relationshipType'] }))}
                value={draft.relationshipType}
              >
                <option value="">Select relationship</option>
                {guardianRelationshipOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="guardian-notes">Notes</FieldLabel>
              <textarea
                className="min-h-28 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                id="guardian-notes"
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Specific instructions about the guardian"
                value={draft.notes}
              />
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { key: "isPrimaryGuardian", label: "Primary guardian" },
              { key: "isFinancialResponsible", label: "Financial responsible" },
              { key: "receivesNotifications", label: "Receives notifications" },
              { key: "canPickupChild", label: "Can pick up child" }
            ].map((item) => (
              <label
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-medium text-[var(--color-foreground)]"
                key={item.key}
              >
                <input
                  checked={Boolean(draft[item.key as keyof GuardianDraft])}
                  className="size-4"
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [item.key]: event.target.checked }))
                  }
                  type="checkbox"
                />
                {item.label}
              </label>
            ))}
          </div>

          {errorMessage ? <FieldMessage className="text-red-600">{errorMessage}</FieldMessage> : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSubmitDraft}>{editingGuardianId ? "Update guardian" : "Add guardian"}</Button>
            <Button onClick={resetDraft} variant="outline">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guardians linked to the student</CardTitle>
          <CardDescription>Mocked relationship list prepared for future validations and API persistence.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <table className="min-w-[920px] w-full border-collapse text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-left text-[var(--color-muted-foreground)]">
                <tr>
                  {[
                    "Guardian name",
                    "Relationship",
                    "Phone",
                    "Primary",
                    "Financial",
                    "Notifications",
                    "Can pick up",
                    "Actions"
                  ].map((label) => (
                    <th className="px-4 py-3 font-semibold" key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guardians.length ? (
                  guardians.map((guardian) => (
                    <tr className="border-t border-[var(--color-border)]" key={guardian.id}>
                      <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">{guardian.person.fullName}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{getRelationshipLabel(guardian.relationshipType)}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{guardian.person.phone}</td>
                      <td className="px-4 py-3">{guardian.isPrimaryGuardian ? <Badge>Yes</Badge> : <Badge variant="neutral">No</Badge>}</td>
                      <td className="px-4 py-3">{guardian.isFinancialResponsible ? <Badge>Yes</Badge> : <Badge variant="neutral">No</Badge>}</td>
                      <td className="px-4 py-3">{guardian.receivesNotifications ? <Badge>Yes</Badge> : <Badge variant="neutral">No</Badge>}</td>
                      <td className="px-4 py-3">{guardian.canPickupChild ? <Badge>Yes</Badge> : <Badge variant="neutral">No</Badge>}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button onClick={() => handleEdit(guardian)} size="sm" variant="outline">
                            Edit
                          </Button>
                          <Button
                            onClick={() => onChange(guardians.filter((item) => item.id !== guardian.id))}
                            size="sm"
                            variant="ghost"
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={8}>
                      No guardians linked yet. Add at least one responsible person to continue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <PersonSearchModal
        onClose={() => setIsModalOpen(false)}
        onSelect={(person) => {
          setDraft((current) => ({ ...current, person }));
          setErrorMessage(null);
        }}
        open={isModalOpen}
        title="Search Responsible Person"
      />
    </div>
  );
}
