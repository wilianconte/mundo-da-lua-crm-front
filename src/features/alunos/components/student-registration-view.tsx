"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, Loader2, Plus, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getAllMockPeople,
  getStudentById,
  saveStudent,
  studentStatusOptions,
  type MockCourse,
  type MockPerson,
  type StudentCourseEnrollment,
  type StudentGuardian
} from "@/features/alunos/api/student-mock-service";
import { getStudentPersonById } from "@/features/alunos/api/search-student-people";
import { CourseAutocomplete } from "@/features/alunos/components/course-autocomplete";
import { CourseSearchModal } from "@/features/alunos/components/course-search-modal";
import { GuardiansEditor } from "@/features/alunos/components/guardians-editor";
import { PersonAutocomplete } from "@/features/alunos/components/person-autocomplete";
import { PersonSearchModal } from "@/features/alunos/components/person-search-modal";
import { RegistrationViewHeader } from "@/features/components/registration-view-header";
import { studentFormSchema, type StudentFormSchema } from "@/features/alunos/schema/student-form-schema";
import { cn } from "@/lib/utils/cn";

type StudentTabKey = "general" | "guardians" | "health" | "authorizations" | "history";

const tabs: Array<{ key: StudentTabKey; label: string; description: string }> = [
  { key: "general", label: "Dados gerais", description: "Cadastro principal do aluno e pessoa vinculada." },
  { key: "guardians", label: "Responsaveis", description: "Pessoas responsaveis e regras de parentesco." },
  { key: "health", label: "Saude e cuidados", description: "Secao mock preparada para futuros dados clinicos." },
  { key: "authorizations", label: "Autorizacoes", description: "Secao mock preparada para permissoes e regras de retirada." },
  { key: "history", label: "Historico / Observacoes", description: "Secao mock preparada para ocorrencias e registros internos." }
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
  const [courses, setCourses] = useState<StudentCourseEnrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<MockCourse | null>(null);
  const [courseStartDate, setCourseStartDate] = useState("");
  const [courseEndDate, setCourseEndDate] = useState("");
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isPersonDetailsModalOpen, setIsPersonDetailsModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isCourseDetailsModalOpen, setIsCourseDetailsModalOpen] = useState(false);
  const [isLoadingStudent, setIsLoadingStudent] = useState(isEditMode && Boolean(studentId));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Cadastro realizado com sucesso.");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<StudentFormSchema>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      personId: "",
      status: "ACTIVE",
      notes: ""
    }
  });

  useEffect(() => {
    register("personId");
  }, [register]);

  useEffect(() => {
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

        const mockPerson = allPeople.find((item) => item.id === student.personId) ?? null;
        const person = mockPerson ?? (await getStudentPersonById(student.personId).catch(() => null));
        if (!active) return;

        setSelectedPerson(person);
        if (!person) {
          setFormError("Nao foi possivel carregar a pessoa vinculada ao aluno.");
        }
        setGuardians(student.guardians);

        const legacyCourse: StudentCourseEnrollment = {
          id: `legacy-course-${student.id}`,
          course: {
            id: `legacy-${student.id}`,
            name: student.school || "Curso legado",
            code: "LEGACY",
            category: student.gradeClass || "Legado"
          },
          registrationNumber: student.registrationNumber,
          startDate: student.startDate,
          endDate: undefined
        };
        setCourses(student.courses?.length ? student.courses : [legacyCourse]);

        reset({
          personId: student.personId,
          status: student.status,
          notes: student.notes ?? ""
        });
      } finally {
        if (active) setIsLoadingStudent(false);
      }
    }

    loadStudent();

    return () => {
      active = false;
    };
  }, [allPeople, isEditMode, studentId, reset]);

  useEffect(() => {
    if (!isSuccessModalOpen) return;

    const timeoutId = window.setTimeout(() => {
      router.push("/alunos/pesquisa");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessModalOpen, router]);

  function handlePersonSelected(person: MockPerson) {
    setSelectedPerson(person);
    setValue("personId", person.id, { shouldValidate: true, shouldDirty: true });
    setFormError(null);
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

    const enrollment: StudentCourseEnrollment = {
      id: `enrollment-${Date.now()}`,
      course: selectedCourse,
      registrationNumber: selectedCourse.code,
      startDate: courseStartDate,
      endDate: courseEndDate || undefined
    };

    setCourses((current) => [...current, enrollment]);
    setSelectedCourse(null);
    setCourseStartDate("");
    setCourseEndDate("");
    setFormError(null);
  }

  async function onSubmit(values: StudentFormSchema) {
    if (!courses.length) {
      setFormError("Adicione pelo menos um curso para salvar o aluno.");
      return;
    }

    try {
      setFormError(null);

      const primaryCourse = courses[0];
      await saveStudent(isEditMode ? studentId : null, {
        ...values,
        registrationNumber: primaryCourse.registrationNumber,
        school: primaryCourse.course.name,
        gradeClass: primaryCourse.course.category,
        startDate: primaryCourse.startDate,
        notes: values.notes,
        guardians,
        courses
      });
      setSuccessMessage(isEditMode ? "Alteracao realizada com sucesso." : "Cadastro realizado com sucesso.");
      setIsSuccessModalOpen(true);
    } catch {
      setFormError("Nao foi possivel salvar o aluno agora.");
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
      <RegistrationViewHeader
        actions={
          <Button
            disabled={isSubmitting || isLoadingStudent || isSuccessModalOpen}
            form="student-form"
            leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            type="submit"
          >
            {isEditMode ? "Salvar" : "Salvar aluno"}
          </Button>
        }
        backAriaLabel="Voltar para pesquisa de alunos"
        backHref="/alunos/pesquisa"
        description="Fluxo de cadastro mock com selecao reutilizavel de pessoas, cursos e gerenciamento de responsaveis."
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
                <Loader2 className="size-4 animate-spin" /> Carregando dados mock do aluno...
              </CardContent>
            </Card>
          ) : null}

          {selectedTab === "general" ? (
            <Card>
              <CardHeader>
                <CardTitle>Dados gerais</CardTitle>
                <CardDescription>
                  Vincule o aluno a uma pessoa e adicione os cursos com matricula e data de inicio.
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
                      <Eye className="size-4" />
                    </button>
                  </div>
                  <PersonAutocomplete
                    label="Pessoa"
                    onCreateNew={() => router.push("/pessoas/cadastro")}
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
                    onOpenModal={() => setIsCourseModalOpen(true)}
                    onSelect={handleCourseSelected}
                    value={selectedCourse}
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
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
                  <Field>
                    <FieldLabel htmlFor="student-status">Status</FieldLabel>
                    <select
                      className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                      id="student-status"
                      {...register("status")}
                    >
                      {studentStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
                  <table className="min-w-[680px] w-full border-collapse text-sm">
                    <thead className="bg-[var(--color-surface-muted)] text-left text-[var(--color-muted-foreground)]">
                      <tr>
                        {["Curso", "Inicio", "Fim", "Acao"].map((label) => (
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
                            <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                              {enrollment.startDate}
                            </td>
                            <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{enrollment.endDate ?? "-"}</td>
                            <td className="px-4 py-3">
                              <Button
                                onClick={() =>
                                  setCourses((current) =>
                                    current.filter((item) => item.id !== enrollment.id)
                                  )
                                }
                                size="sm"
                                variant="ghost"
                              >
                                Remover
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t border-[var(--color-border)]">
                          <td className="px-4 py-6 text-center text-[var(--color-muted-foreground)]" colSpan={4}>
                            Nenhum curso adicionado ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

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

          {selectedTab === "guardians" ? <GuardiansEditor guardians={guardians} onChange={setGuardians} /> : null}

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
                  Redirecionando para a listagem de alunos...
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
