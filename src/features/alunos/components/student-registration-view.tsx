"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Save, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getAllMockPeople,
  getStudentById,
  getStudentStatusLabel,
  saveStudent,
  studentStatusOptions,
  type MockPerson,
  type StudentGuardian
} from "@/features/alunos/api/student-mock-service";
import { GuardiansEditor } from "@/features/alunos/components/guardians-editor";
import { PersonAutocomplete } from "@/features/alunos/components/person-autocomplete";
import { PersonSearchModal } from "@/features/alunos/components/person-search-modal";
import { StudentSummaryCard } from "@/features/alunos/components/student-summary-card";
import { studentFormSchema, type StudentFormSchema } from "@/features/alunos/schema/student-form-schema";
import { cn } from "@/lib/utils/cn";

type StudentTabKey = "general" | "guardians" | "health" | "authorizations" | "history";

const tabs: Array<{ key: StudentTabKey; label: string; description: string }> = [
  { key: "general", label: "General Data", description: "Main student record and linked person." },
  { key: "guardians", label: "Guardians", description: "Responsible people and relationship rules." },
  { key: "health", label: "Health & Care", description: "Prepared mock section for future clinical details." },
  { key: "authorizations", label: "Authorizations", description: "Prepared mock section for permissions and pickup rules." },
  { key: "history", label: "History / Notes", description: "Prepared mock section for occurrences and internal logs." }
];

export function StudentRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const studentId = searchParams.get("id");
  const allPeople = useMemo(() => getAllMockPeople(), []);
  const [selectedTab, setSelectedTab] = useState<StudentTabKey>("general");
  const [selectedPerson, setSelectedPerson] = useState<MockPerson | null>(null);
  const [guardians, setGuardians] = useState<StudentGuardian[]>([]);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isLoadingStudent, setIsLoadingStudent] = useState(isEditMode && Boolean(studentId));
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm<StudentFormSchema>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      personId: "",
      registrationNumber: "",
      status: "ACTIVE",
      school: "",
      gradeClass: "",
      startDate: "",
      notes: ""
    }
  });


  const status = useWatch({ control, name: "status" });

  useEffect(() => {
    register("personId");
  }, [register]);

  useEffect(() => {
    if (!isEditMode || !studentId) return;

    let active = true;
    getStudentById(studentId)
      .then((student) => {
        if (!active) return;
        if (!student) {
          setFormError("Student not found.");
          return;
        }

        const person = allPeople.find((item) => item.id === student.personId) ?? null;
        setSelectedPerson(person);
        setGuardians(student.guardians);
        reset({
          personId: student.personId,
          registrationNumber: student.registrationNumber,
          status: student.status,
          school: student.school,
          gradeClass: student.gradeClass,
          startDate: student.startDate,
          notes: student.notes ?? ""
        });
      })
      .finally(() => {
        if (active) setIsLoadingStudent(false);
      });

    return () => {
      active = false;
    };
  }, [allPeople, isEditMode, studentId, reset]);

  function handlePersonSelected(person: MockPerson) {
    setSelectedPerson(person);
    setValue("personId", person.id, { shouldValidate: true, shouldDirty: true });
    setFormError(null);
  }

  async function onSubmit(values: StudentFormSchema) {
    try {
      setFormError(null);
      setSuccessMessage(null);
      await saveStudent(isEditMode ? studentId : null, {
        ...values,
        notes: values.notes,
        guardians
      });
      setSuccessMessage(isEditMode ? "Student updated successfully in mock mode." : "Student created successfully in mock mode.");
      window.setTimeout(() => router.push("/alunos/pesquisa"), 1400);
    } catch {
      setFormError("Unable to save student right now.");
    }
  }

  function renderPlaceholder(title: string, description: string, fields: string[]) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-4" key={field}>
              <p className="text-sm font-medium text-[var(--color-foreground)]">{field}</p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Placeholder prepared for future API-backed implementation.</p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <Link className="hover:text-[var(--color-foreground)]" href="/">Dashboard</Link>
          <span>/</span>
          <Link className="hover:text-[var(--color-foreground)]" href="/alunos/pesquisa">Students</Link>
          <span>/</span>
          <span className="text-[var(--color-foreground)]">{isEditMode ? "Edit student" : "Create student"}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">Student</p>
            <h2 className="text-2xl font-semibold tracking-tight">{isEditMode ? "Edit student" : "Create student"}</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Mock registration flow with reusable person selection and guardian management components.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/alunos/pesquisa"><Button variant="outline">Back to search</Button></Link>
            <Button form="student-form" leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} type="submit">
              {isEditMode ? "Save changes" : "Save student"}
            </Button>
          </div>
        </div>
      </section>

      {isEditMode && selectedPerson ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Editing summary</p>
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{selectedPerson.fullName}</h3>
              <p className="text-sm text-[var(--color-muted-foreground)]">{selectedPerson.documentNumber} · {selectedPerson.phone}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="attention">Mock persisted locally</Badge>
              <Badge variant="neutral">{guardians.length} guardian(s)</Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {successMessage ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-start gap-3 p-4 text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-5" />
            <p className="text-sm font-medium">{successMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      {formError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 p-4 text-red-700">
            <AlertCircle className="mt-0.5 size-5" />
            <p className="text-sm font-medium">{formError}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="p-3">
            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  className={cn(
                    "rounded-[var(--radius-md)] border px-4 py-3 text-left transition",
                    selectedTab === tab.key
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
                      : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                  )}
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  type="button"
                >
                  <p className="text-sm font-semibold">{tab.label}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{tab.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <form className="space-y-6" id="student-form" onSubmit={handleSubmit(onSubmit)}>
          {isLoadingStudent ? (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="size-4 animate-spin" /> Loading mock student data...
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "general" ? (
            <Card>
              <CardHeader>
                <CardTitle>General Data</CardTitle>
                <CardDescription>
                  Link the student to a person using autocomplete or the advanced person search modal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Field>
                  <FieldLabel>Person</FieldLabel>
                  <PersonAutocomplete
                    label="Person"
                    onOpenModal={() => setIsPersonModalOpen(true)}
                    onSelect={handlePersonSelected}
                    value={selectedPerson}
                  />
                  {errors.personId ? <FieldMessage className="text-red-600">{errors.personId.message}</FieldMessage> : null}
                </Field>

                {selectedPerson ? <StudentSummaryCard person={selectedPerson} /> : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="registration-number">Registration number</FieldLabel>
                    <Input id="registration-number" placeholder="STU-2026-001" {...register("registrationNumber")} />
                    {errors.registrationNumber ? <FieldMessage className="text-red-600">{errors.registrationNumber.message}</FieldMessage> : null}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-status">Status</FieldLabel>
                    <select
                      className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                      id="student-status"
                      {...register("status")}
                    >
                      {studentStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-start-date">Start date</FieldLabel>
                    <Input id="student-start-date" type="date" {...register("startDate")} />
                    {errors.startDate ? <FieldMessage className="text-red-600">{errors.startDate.message}</FieldMessage> : null}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-school">School</FieldLabel>
                    <Input id="student-school" placeholder="Mundo da Lua Kids" {...register("school")} />
                    {errors.school ? <FieldMessage className="text-red-600">{errors.school.message}</FieldMessage> : null}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-grade-class">Grade/Class</FieldLabel>
                    <Input id="student-grade-class" placeholder="Grade 2 / Sun" {...register("gradeClass")} />
                    {errors.gradeClass ? <FieldMessage className="text-red-600">{errors.gradeClass.message}</FieldMessage> : null}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="student-linked-person-status">Linked person</FieldLabel>
                    <div className="flex h-12 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-sm text-[var(--color-muted-foreground)]">
                      {selectedPerson ? `${selectedPerson.fullName} selected` : "No person linked yet"}
                    </div>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="student-notes">General observations</FieldLabel>
                  <textarea
                    className="min-h-32 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                    id="student-notes"
                    placeholder="Add notes about enrollment, adaptation, or internal observations"
                    {...register("notes")}
                  />
                </Field>
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "guardians" ? <GuardiansEditor guardians={guardians} onChange={setGuardians} /> : null}

          {selectedTab === "health"
            ? renderPlaceholder("Health & Care", "Prepared placeholders for future medical and care records.", [
                "Allergies",
                "Dietary restrictions",
                "Medication use",
                "Medical notes",
                "Special care needs",
                "Emergency notes"
              ])
            : null}

          {selectedTab === "authorizations"
            ? renderPlaceholder("Authorizations", "Prepared placeholders for image, exit, and pickup authorization workflows.", [
                "Image authorization",
                "Exit authorization",
                "Pickup restrictions",
                "Additional authorized persons",
                "Notes"
              ])
            : null}

          {selectedTab === "history"
            ? renderPlaceholder("History / Notes", "Prepared placeholders for future internal timeline and administrative events.", [
                "Internal notes",
                "Occurrences",
                "Administrative observations",
                "Change log placeholder"
              ])
            : null}

          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
                <Users className="size-4" />
                {guardians.length} linked guardian(s)
                <span>· {getStudentStatusLabel(status ?? "ACTIVE")}</span>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setSelectedTab("general")} type="button" variant="ghost">Review general data</Button>
                <Button leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} type="submit">
                  {isEditMode ? "Save changes" : "Save student"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      <PersonSearchModal onClose={() => setIsPersonModalOpen(false)} onSelect={handlePersonSelected} open={isPersonModalOpen} />
    </div>
  );
}
