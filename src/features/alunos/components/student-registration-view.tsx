"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, Loader2, Plus, Save, Trash2, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import {
  deleteStudent,
  deleteStudentCourse,
  deleteStudentGuardian,
  getStudentById,
  mapStudentApiError,
  saveStudent,
  studentCourseStatusOptions,
  type MockCourse,
  type MockPerson,
  type StudentCourseEnrollment,
  type StudentGuardian
} from "@/features/alunos/api/student-mock-service";
import { getStudentCourseById } from "@/features/alunos/api/search-student-courses";
import { getStudentPersonById } from "@/features/alunos/api/search-student-people";
import { CourseAutocomplete } from "@/features/alunos/components/course-autocomplete";
import { CourseSearchModal } from "@/features/alunos/components/course-search-modal";
import { GuardiansEditor } from "@/features/alunos/components/guardians-editor";
import { PersonAutocomplete } from "@/features/alunos/components/person-autocomplete";
import { PersonSearchModal } from "@/features/alunos/components/person-search-modal";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { studentFormSchema, type StudentFormSchema } from "@/features/alunos/schema/student-form-schema";
import { cn } from "@/lib/utils/cn";

type StudentTabKey = "general" | "courses" | "guardians" | "health" | "authorizations" | "history";
type CreatedPersonTarget = "student" | "guardian";

const tabs: Array<{ key: StudentTabKey; label: string; description: string }> = [
  { key: "general", label: "Dados gerais", description: "Cadastro principal do aluno e pessoa vinculada." },
  { key: "courses", label: "Cursos", description: "Matriculas e status dos cursos vinculados ao aluno." },
  { key: "guardians", label: "Responsaveis", description: "Pessoas responsaveis e regras de parentesco." },
  { key: "health", label: "Saude e cuidados", description: "Secao mock preparada para futuros dados clinicos." },
  { key: "authorizations", label: "Autorizacoes", description: "Secao mock preparada para permissoes e regras de retirada." },
  { key: "history", label: "Historico / Observacoes", description: "Secao mock preparada para ocorrencias e registros internos." }
];

const STUDENT_REGISTRATION_STATE_PREFIX = "mdl:student-registration:";

type StudentRegistrationDraft = {
  courseEndDate: string;
  courseStartDate: string;
  courses: StudentCourseEnrollment[];
  formValues: StudentFormSchema;
  guardians: StudentGuardian[];
  selectedCourse: MockCourse | null;
  selectedPerson: MockPerson | null;
  selectedTab: StudentTabKey;
};

function isPersistedEntityId(id: string) {
  return !id.startsWith("enrollment-") && !id.startsWith("guardian-draft-") && !id.startsWith("legacy-course-");
}

export function StudentRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const studentId = searchParams.get("id");
  const restoreStateKey = searchParams.get("restoreState");
  const createdPersonId = searchParams.get("createdPersonId");
  const createdPersonTarget = searchParams.get("createdPersonTarget");
  const createdCourseId = searchParams.get("createdCourseId");
  const hasRestoredStateRef = useRef(false);
  const [selectedTab, setSelectedTab] = useState<StudentTabKey>("general");
  const [selectedPerson, setSelectedPerson] = useState<MockPerson | null>(null);
  const [guardians, setGuardians] = useState<StudentGuardian[]>([]);
  const [courses, setCourses] = useState<StudentCourseEnrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<MockCourse | null>(null);
  const [courseStartDate, setCourseStartDate] = useState("");
  const [courseEndDate, setCourseEndDate] = useState("");
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isPersonDetailsModalOpen, setIsPersonDetailsModalOpen] = useState(false);
  const [isPersonLockInfoModalOpen, setIsPersonLockInfoModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isCourseDetailsModalOpen, setIsCourseDetailsModalOpen] = useState(false);
  const [isLoadingStudent, setIsLoadingStudent] = useState(isEditMode && Boolean(studentId));
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [isDeleteStudentConfirmOpen, setIsDeleteStudentConfirmOpen] = useState(false);
  const [courseToRemove, setCourseToRemove] = useState<StudentCourseEnrollment | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSuccessModalLoading, setIsSuccessModalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Cadastro realizado com sucesso.");
  const [successRedirectPath, setSuccessRedirectPath] = useState("/alunos/pesquisa");
  const hasLinkedGuardians = guardians.length > 0;
  const isStudentPersonLocked = isEditMode && hasLinkedGuardians;

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<StudentFormSchema>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      personId: "",
      notes: ""
    }
  });

  useEffect(() => {
    register("personId");
  }, [register]);

  useEffect(() => {
    if (restoreStateKey) {
      setIsLoadingStudent(false);
      return;
    }

    if (!isEditMode || !studentId) return;

    let active = true;
    const currentStudentId = studentId;

    async function loadStudent() {
      try {
        const student = await getStudentById(currentStudentId);
        if (!active) return;
        if (!student) {
          setFormError("Aluno nao encontrado.");
          return;
        }

        const person = await getStudentPersonById(student.personId).catch(() => null);
        if (!active) return;

        setSelectedPerson(person);
        if (!person) {
          setFormError("Nao foi possivel carregar a pessoa vinculada ao aluno.");
        }
        setGuardians(student.guardians);

        setCourses(student.courses ?? []);

        reset({
          personId: student.personId,
          notes: student.notes ?? ""
        });
      } catch (error) {
        if (!active) return;
        setFormError(mapStudentApiError(error));
      } finally {
        if (active) setIsLoadingStudent(false);
      }
    }

    loadStudent();

    return () => {
      active = false;
    };
  }, [isEditMode, studentId, reset, restoreStateKey]);

  useEffect(() => {
    if (!isSuccessModalOpen || isSuccessModalLoading) return;

    const timeoutId = window.setTimeout(() => {
      router.push(successRedirectPath);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalLoading, isSuccessModalOpen, router, successRedirectPath]);

  useEffect(() => {
    if (hasRestoredStateRef.current) return;
    if (!restoreStateKey && !createdPersonId && !createdCourseId) return;

    hasRestoredStateRef.current = true;

    if (restoreStateKey && typeof window !== "undefined") {
      const rawState = window.sessionStorage.getItem(restoreStateKey);
      if (rawState) {
        try {
          const parsed = JSON.parse(rawState) as StudentRegistrationDraft;
          setSelectedTab(parsed.selectedTab ?? "general");
          setSelectedPerson(parsed.selectedPerson ?? null);
          setGuardians(parsed.guardians ?? []);
          setCourses(parsed.courses ?? []);
          setSelectedCourse(parsed.selectedCourse ?? null);
          setCourseStartDate(parsed.courseStartDate ?? "");
          setCourseEndDate(parsed.courseEndDate ?? "");
          reset(parsed.formValues ?? {
            personId: "",
            notes: ""
          });
        } catch {
          setFormError("Nao foi possivel restaurar o estado anterior do cadastro.");
        } finally {
          window.sessionStorage.removeItem(restoreStateKey);
        }
      }
    }

    if (createdPersonId) {
      const target: CreatedPersonTarget =
        createdPersonTarget === "guardian" ? "guardian" : "student";

      if (target === "student") {
        getStudentPersonById(createdPersonId)
          .then((person) => {
            if (!person) return;
            setSelectedPerson(person);
            setValue("personId", person.id, { shouldValidate: true, shouldDirty: true });
            setFormError(null);
          })
          .catch(() => {
            setFormError("Pessoa recem-cadastrada nao encontrada para vincular ao aluno.");
          });
      }
    }

    if (createdCourseId) {
      getStudentCourseById(createdCourseId)
        .then((course) => {
          if (!course) return;
          setSelectedCourse(course);
          setFormError(null);
        })
        .catch(() => {
          setFormError("Curso recem-cadastrado nao encontrado para vincular ao aluno.");
        });
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("restoreState");
    nextParams.delete("createdPersonId");
    nextParams.delete("createdPersonTarget");
    nextParams.delete("createdCourseId");
    const nextUrl = nextParams.toString() ? `/alunos/cadastro?${nextParams.toString()}` : "/alunos/cadastro";
    router.replace(nextUrl);
  }, [createdCourseId, createdPersonId, createdPersonTarget, restoreStateKey, reset, router, searchParams, setValue]);

  function handlePersonSelected(person: MockPerson) {
    setSelectedPerson(person);
    setValue("personId", person.id, { shouldValidate: true, shouldDirty: true });
    setFormError(null);
  }

  function handleCreatePersonFromStudent(query: string, target: CreatedPersonTarget) {
    if (typeof window === "undefined") {
      router.push("/pessoas/cadastro");
      return;
    }

    const stateKey = `${STUDENT_REGISTRATION_STATE_PREFIX}${Date.now()}`;
    const snapshot: StudentRegistrationDraft = {
      courseEndDate,
      courseStartDate,
      courses,
      formValues: getValues(),
      guardians,
      selectedCourse,
      selectedPerson,
      selectedTab
    };

    window.sessionStorage.setItem(stateKey, JSON.stringify(snapshot));

    const returnParams = new URLSearchParams(searchParams.toString());
    returnParams.delete("restoreState");
    returnParams.delete("createdPersonId");
    returnParams.delete("createdPersonTarget");
    returnParams.delete("createdCourseId");
    returnParams.set("restoreState", stateKey);
    const returnTo = `/alunos/cadastro${returnParams.toString() ? `?${returnParams.toString()}` : ""}`;

    const personParams = new URLSearchParams();
    personParams.set("returnTo", returnTo);
    personParams.set("prefillName", query.trim());
    personParams.set("createdPersonTarget", target);
    router.push(`/pessoas/cadastro?${personParams.toString()}`);
  }

  function handleCreateStudentPerson(query: string) {
    handleCreatePersonFromStudent(query, "student");
  }

  function handleCreateGuardianPerson(query: string) {
    handleCreatePersonFromStudent(query, "guardian");
  }

  function handleCreateCourseFromStudent(query: string) {
    if (typeof window === "undefined") {
      router.push("/cursos/cadastro");
      return;
    }

    const stateKey = `${STUDENT_REGISTRATION_STATE_PREFIX}${Date.now()}`;
    const snapshot: StudentRegistrationDraft = {
      courseEndDate,
      courseStartDate,
      courses,
      formValues: getValues(),
      guardians,
      selectedCourse,
      selectedPerson,
      selectedTab
    };

    window.sessionStorage.setItem(stateKey, JSON.stringify(snapshot));

    const returnParams = new URLSearchParams(searchParams.toString());
    returnParams.delete("restoreState");
    returnParams.delete("createdPersonId");
    returnParams.delete("createdCourseId");
    returnParams.set("restoreState", stateKey);
    const returnTo = `/alunos/cadastro${returnParams.toString() ? `?${returnParams.toString()}` : ""}`;

    const courseParams = new URLSearchParams();
    courseParams.set("returnTo", returnTo);
    courseParams.set("prefillName", query.trim());
    router.push(`/cursos/cadastro?${courseParams.toString()}`);
  }

  function handleCourseSelected(course: MockCourse) {
    setSelectedCourse(course);
    setFormError(null);
  }

  function addCourseEnrollment() {
    if (!selectedCourse) {
      setFormError("Selecione um curso antes de adicionar.");
      return;
    }

    if (!courseStartDate) {
      setFormError("Informe a data de inicio do curso.");
      return;
    }

    if (courses.some((course) => course.course.id === selectedCourse.id)) {
      setFormError("Este curso ja foi adicionado.");
      return;
    }

    if (courseEndDate && courseEndDate <= courseStartDate) {
      setFormError("A data de fim do curso deve ser posterior a data de inicio.");
      return;
    }

    const enrollment: StudentCourseEnrollment = {
      id: `enrollment-${Date.now()}`,
      course: selectedCourse,
      registrationNumber: selectedCourse.code,
      startDate: courseStartDate,
      endDate: courseEndDate || undefined,
      status: "ACTIVE"
    };

    setCourses((current) => [...current, enrollment]);
    setSelectedCourse(null);
    setCourseStartDate("");
    setCourseEndDate("");
    setFormError(null);
  }

  function handleCourseStatusChange(enrollmentId: string, status: StudentCourseEnrollment["status"]) {
    setCourses((current) =>
      current.map((item) => (item.id === enrollmentId ? { ...item, status } : item))
    );
    setFormError(null);
  }

  async function onSubmit(values: StudentFormSchema) {
    try {
      setFormError(null);
      setSuccessRedirectPath("/alunos/pesquisa");
      setSuccessMessage(isEditMode ? "Salvando alteracao..." : "Salvando cadastro...");
      setIsSuccessModalLoading(true);
      setIsSuccessModalOpen(true);

      await saveStudent(isEditMode ? studentId : null, {
        ...values,
        guardians,
        courses
      });
      setSuccessMessage(isEditMode ? "Alteracao realizada com sucesso." : "Cadastro realizado com sucesso.");
      setIsSuccessModalLoading(false);
    } catch (error) {
      setIsSuccessModalLoading(false);
      setIsSuccessModalOpen(false);
      setFormError(mapStudentApiError(error));
    }
  }

  async function confirmDeleteStudent() {
    if (!studentId || !isEditMode) return;

    try {
      setFormError(null);
      setIsDeleteStudentConfirmOpen(false);
      setIsDeletingStudent(true);
      const deleted = await deleteStudent(studentId);
      if (!deleted) {
        setFormError("Nao foi possivel excluir o aluno.");
        return;
      }

      setSuccessMessage("Aluno excluido com sucesso.");
      setSuccessRedirectPath("/alunos/pesquisa");
      setIsSuccessModalLoading(false);
      setIsSuccessModalOpen(true);
    } catch (error) {
      setFormError(mapStudentApiError(error));
    } finally {
      setIsDeletingStudent(false);
    }
  }

  async function confirmRemoveCourse() {
    if (!courseToRemove) return;

    try {
      setFormError(null);
      setDeletingCourseId(courseToRemove.id);
      const shouldDeleteOnBackend = isEditMode && isPersistedEntityId(courseToRemove.id);
      if (shouldDeleteOnBackend) {
        const deleted = await deleteStudentCourse(courseToRemove.id);
        if (!deleted) {
          setFormError("Nao foi possivel remover o curso.");
          return;
        }
      }

      setCourses((current) => current.filter((item) => item.id !== courseToRemove.id));
      setCourseToRemove(null);
    } catch (error) {
      setFormError(mapStudentApiError(error));
    } finally {
      setDeletingCourseId(null);
    }
  }

  async function handleRemoveGuardian(guardian: StudentGuardian) {
    const shouldDeleteOnBackend = isEditMode && isPersistedEntityId(guardian.id);
    if (shouldDeleteOnBackend) {
      const deleted = await deleteStudentGuardian(guardian.id);
      if (!deleted) {
        throw new Error("Nao foi possivel remover o responsavel.");
      }
    }

    setGuardians((current) => current.filter((item) => item.id !== guardian.id));
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
            <div
              className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-4"
              key={field}
            >
              <p className="text-sm font-medium text-[var(--color-foreground)]">{field}</p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Placeholder preparado para futura implementacao integrada por API.
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FeatureViewHeader
        actions={
          <>
            {isEditMode ? (
              <Button
                className="min-w-40"
                disabled={
                  isDeletingStudent ||
                  isSubmitting ||
                  isLoadingStudent ||
                  isDeleteStudentConfirmOpen ||
                  isSuccessModalOpen
                }
                leadingIcon={isDeletingStudent ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                onClick={() => setIsDeleteStudentConfirmOpen(true)}
                type="button"
                variant="danger-outline"
              >
                {isDeletingStudent ? "Excluindo..." : "Excluir"}
              </Button>
            ) : null}
            <Button
              className="min-w-40"
              disabled={isDeletingStudent || isSubmitting || isLoadingStudent || isSuccessModalOpen}
              form="student-form"
              leadingIcon={<Save className="size-4" />}
              type="submit"
            >
              Salvar
            </Button>
          </>
        }
        backAriaLabel="Voltar para pesquisa de alunos"
        backHref="/alunos/pesquisa"
        description="Cadastro de estudante com vinculo opcional de cursos e responsaveis."
        title={<span className="text-xl">{isEditMode ? "Editar aluno" : "Novo aluno"}</span>}
      />

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
                <Loader2 className="size-4 animate-spin" /> Carregando dados do aluno...
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "general" ? (
            <Card>
              <CardHeader>
                <CardTitle>Dados gerais</CardTitle>
                <CardDescription>
                  Vincule o aluno a uma pessoa e preencha os dados cadastrais principais.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Field>
                  <div className="flex items-center gap-2">
                    <FieldLabel>Pessoa</FieldLabel>
                    <button
                      aria-label="Ver dados da pessoa selecionada"
                      className="inline-flex items-center justify-center text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)] disabled:opacity-40"
                      disabled={!selectedPerson}
                      onClick={() => setIsPersonDetailsModalOpen(true)}
                      type="button"
                    >
                      <User className="size-4" />
                    </button>
                    {isStudentPersonLocked ? (
                      <button
                        aria-label="Ver observacao de bloqueio da pessoa do aluno"
                        className="inline-flex items-center justify-center text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
                        onClick={() => setIsPersonLockInfoModalOpen(true)}
                        type="button"
                      >
                        <AlertCircle className="size-4" />
                      </button>
                    ) : null}
                  </div>
                  <PersonAutocomplete
                    disabled={isStudentPersonLocked}
                    label="Pessoa"
                    onCreateNew={handleCreateStudentPerson}
                    onOpenModal={() => setIsPersonModalOpen(true)}
                    onSelect={handlePersonSelected}
                    value={selectedPerson}
                  />
                  {errors.personId ? (
                    <FieldMessage className="text-red-600">{errors.personId.message}</FieldMessage>
                  ) : null}
                </Field>

                <div aria-hidden="true" className="h-px w-full bg-[var(--color-border)]" />

                <Field>
                  <FieldLabel htmlFor="student-notes">Observacoes gerais</FieldLabel>
                  <textarea
                    className="min-h-32 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                    id="student-notes"
                    placeholder="Adicione observacoes sobre matricula, adaptacao ou anotacoes internas"
                    {...register("notes")}
                  />
                </Field>

              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "courses" ? (
            <Card>
              <CardHeader>
                <CardTitle>Cursos</CardTitle>
                <CardDescription>
                  Gerencie as matriculas do aluno e altere o status de cada curso associado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Field>
                  <div className="flex items-center gap-2">
                    <FieldLabel>Curso</FieldLabel>
                    <button
                      aria-label="Ver dados do curso selecionado"
                      className="inline-flex items-center justify-center text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)] disabled:opacity-40"
                      disabled={!selectedCourse}
                      onClick={() => setIsCourseDetailsModalOpen(true)}
                      type="button"
                    >
                      <Eye className="size-4" />
                    </button>
                  </div>
                  <CourseAutocomplete
                    excludedCourseIds={courses.map((course) => course.course.id)}
                    onCreateNew={handleCreateCourseFromStudent}
                    onOpenModal={() => setIsCourseModalOpen(true)}
                    onSelect={handleCourseSelected}
                    value={selectedCourse}
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <Field>
                    <FieldLabel htmlFor="course-start-date">Inicio</FieldLabel>
                    <Input
                      id="course-start-date"
                      onChange={(event) => setCourseStartDate(event.target.value)}
                      type="date"
                      value={courseStartDate}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="course-end-date">Fim</FieldLabel>
                    <Input
                      id="course-end-date"
                      onChange={(event) => setCourseEndDate(event.target.value)}
                      type="date"
                      value={courseEndDate}
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button
                      leadingIcon={<Plus className="size-4" />}
                      onClick={addCourseEnrollment}
                      type="button"
                    >
                      Adicionar curso
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
                  <table className="min-w-[760px] w-full border-collapse text-sm">
                    <thead className="bg-[var(--color-surface-muted)] text-left text-[var(--color-muted-foreground)]">
                      <tr>
                        {["Curso", "Inicio", "Fim", "Status", "Acao"].map((label) => (
                          <th className="px-4 py-3 font-semibold" key={label}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {courses.length ? (
                        courses.map((enrollment) => (
                          <tr className="border-t border-[var(--color-border)]" key={enrollment.id}>
                            <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                              {enrollment.course.name}
                            </td>
                            <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{enrollment.startDate}</td>
                            <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{enrollment.endDate ?? "-"}</td>
                            <td className="px-4 py-3">
                              <select
                                aria-label={`Status do curso ${enrollment.course.name}`}
                                className="h-9 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]"
                                onChange={(event) =>
                                  handleCourseStatusChange(
                                    enrollment.id,
                                    event.target.value as StudentCourseEnrollment["status"]
                                  )
                                }
                                value={enrollment.status}
                              >
                                {studentCourseStatusOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                disabled={deletingCourseId === enrollment.id}
                                onClick={() => setCourseToRemove(enrollment)}
                                size="sm"
                                variant="ghost"
                              >
                                {deletingCourseId === enrollment.id ? "Removendo..." : "Remover"}
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t border-[var(--color-border)]">
                          <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={5}>
                            Nenhum curso adicionado ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "guardians" ? (
            <GuardiansEditor
              guardians={guardians}
              onChange={setGuardians}
              onCreateGuardianPerson={handleCreateGuardianPerson}
              onRemoveGuardian={handleRemoveGuardian}
            />
          ) : null}

          {selectedTab === "health"
            ? renderPlaceholder("Saude e cuidados", "Placeholders preparados para futuros registros de saude e cuidado.", [
                "Alergias",
                "Restricoes alimentares",
                "Uso de medicacao",
                "Observacoes medicas",
                "Necessidades especiais de cuidado",
                "Contatos e notas de emergencia"
              ])
            : null}

          {selectedTab === "authorizations"
            ? renderPlaceholder("Autorizacoes", "Placeholders preparados para fluxos de imagem, saida e retirada.", [
                "Autorizacao de imagem",
                "Autorizacao de saida",
                "Restricoes de retirada",
                "Pessoas autorizadas adicionais",
                "Observacoes"
              ])
            : null}

          {selectedTab === "history"
            ? renderPlaceholder("Historico / Observacoes", "Placeholders preparados para linha do tempo interna e eventos administrativos.", [
                "Notas internas",
                "Ocorrencias",
                "Observacoes administrativas",
                "Placeholder de log de alteracoes"
              ])
            : null}

        </form>
      </div>

      <PersonSearchModal
        onClose={() => setIsPersonModalOpen(false)}
        onSelect={handlePersonSelected}
        open={isPersonModalOpen}
      />
      <CourseSearchModal
        onClose={() => setIsCourseModalOpen(false)}
        onSelect={handleCourseSelected}
        open={isCourseModalOpen}
      />
      {isCourseDetailsModalOpen && selectedCourse ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <Card className="w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Dados do curso</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Informacoes completas do curso selecionado.
                </p>
              </div>
              <button
                aria-label="Fechar modal de dados do curso"
                className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
                onClick={() => setIsCourseDetailsModalOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Nome</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">{selectedCourse.name}</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Codigo</p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">{selectedCourse.code}</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Categoria</p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">{selectedCourse.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      {isPersonDetailsModalOpen && selectedPerson ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <Card className="w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Dados da pessoa</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Informacoes completas da pessoa vinculada ao aluno.
                </p>
              </div>
              <button
                aria-label="Fechar modal de dados da pessoa"
                className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
                onClick={() => setIsPersonDetailsModalOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Nome</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">{selectedPerson.fullName}</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Documento</p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">{selectedPerson.documentNumber}</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Telefone</p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">{selectedPerson.phone}</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Email</p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">{selectedPerson.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      {isPersonLockInfoModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <Card className="w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Observacao</h3>
              </div>
              <button
                aria-label="Fechar modal de observacao"
                className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
                onClick={() => setIsPersonLockInfoModalOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <CardContent className="space-y-4 p-6">
              <p className="text-sm text-[var(--color-foreground)]">
                A pessoa vinculada ao aluno não pode ser alterada após a criação
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isSuccessModalOpen ? (
        <div
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 size-5 animate-spin text-[var(--color-primary)]" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-[var(--color-foreground)]">{successMessage}</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {isSuccessModalLoading ? "Aguarde, estamos processando os dados..." : "Redirecionando para a listagem de alunos..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmationDialog
        description="Deseja excluir este aluno? Esta acao nao podera ser desfeita."
        isConfirming={isDeletingStudent}
        onCancel={() => setIsDeleteStudentConfirmOpen(false)}
        onConfirm={confirmDeleteStudent}
        open={isDeleteStudentConfirmOpen}
      />

      <ConfirmationDialog
        confirmLabel="Remover"
        confirmPendingLabel="Removendo..."
        description={courseToRemove ? <>Deseja remover a matricula do curso <strong>{courseToRemove.course.name}</strong>?</> : ""}
        isConfirming={Boolean(courseToRemove && deletingCourseId === courseToRemove.id)}
        onCancel={() => setCourseToRemove(null)}
        onConfirm={confirmRemoveCourse}
        open={Boolean(courseToRemove)}
      />
    </div>
  );
}
