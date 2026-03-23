"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Eye, Loader2, Plus, Save, Users, X } from "lucide-react";
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
  type MockCourse,
  type MockPerson,
  type StudentCourseEnrollment,
  type StudentGuardian
} from "@/features/alunos/api/student-mock-service";
import { CourseAutocomplete } from "@/features/alunos/components/course-autocomplete";
import { CourseSearchModal } from "@/features/alunos/components/course-search-modal";
import { GuardiansEditor } from "@/features/alunos/components/guardians-editor";
import { PersonAutocomplete } from "@/features/alunos/components/person-autocomplete";
import { PersonSearchModal } from "@/features/alunos/components/person-search-modal";
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
      status: "ACTIVE",
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
          setFormError("Aluno nao encontrado.");
          return;
        }

        const person = allPeople.find((item) => item.id === student.personId) ?? null;
        setSelectedPerson(person);
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
      setSuccessMessage(null);

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
      setSuccessMessage(
        isEditMode
          ? "Aluno atualizado com sucesso no modo mock."
          : "Aluno criado com sucesso no modo mock."
      );
      window.setTimeout(() => router.push("/alunos/pesquisa"), 1400);
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
      <section className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">Alunos</p>
            <h2 className="text-2xl font-semibold tracking-tight">{isEditMode ? "Editar aluno" : "Novo aluno"}</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Fluxo de cadastro mock com selecao reutilizavel de pessoas, cursos e gerenciamento de responsaveis.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/alunos/pesquisa">
              <Button variant="outline">Voltar para pesquisa</Button>
            </Link>
            <Button
              form="student-form"
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              type="submit"
            >
              {isEditMode ? "Salvar alteracoes" : "Salvar aluno"}
            </Button>
          </div>
        </div>
      </section>

      {isEditMode && selectedPerson ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Resumo da edicao</p>
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{selectedPerson.fullName}</h3>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {selectedPerson.documentNumber} - {selectedPerson.phone}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="attention">Mock persistido localmente</Badge>
              <Badge variant="neutral">{guardians.length} responsavel(eis)</Badge>
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

          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
                <Users className="size-4" />
                {guardians.length} responsavel(eis) vinculado(s)
                <span>- {getStudentStatusLabel(status ?? "ACTIVE")}</span>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setSelectedTab("general")} type="button" variant="ghost">
                  Revisar dados gerais
                </Button>
                <Button
                  leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  type="submit"
                >
                  {isEditMode ? "Salvar alteracoes" : "Salvar aluno"}
                </Button>
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
}
