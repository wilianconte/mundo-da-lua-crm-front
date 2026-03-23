"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  mapCourseApiError,
  updateCourse,
  type CourseUpsertInput
} from "../api/course-upsert";
import {
  courseRegistrationSchema,
  type CourseRegistrationSchema,
  COURSE_STATUS,
  COURSE_TYPES
} from "../schema/course-registration-schema";

const courseTypeLabels: Record<(typeof COURSE_TYPES)[number], string> = {
  AFTER_SCHOOL: "Reforco Escolar",
  LANGUAGE: "Idiomas",
  SCHOOL_CLASS: "Turma Regular",
  WORKSHOP: "Workshop",
  OTHER: "Outros"
};

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  COMPLETED: "Concluido",
  CANCELLED: "Cancelado"
};

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function CourseRegistrationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const courseId = searchParams.get("id");
  const [isLoadingCourse, setIsLoadingCourse] = useState(isEditMode && Boolean(courseId));
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CourseRegistrationSchema>({
    resolver: zodResolver(courseRegistrationSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "OTHER",
      status: "DRAFT",
      description: "",
      startDate: "",
      endDate: "",
      scheduleDescription: "",
      capacity: "",
      workload: "",
      notes: ""
    }
  });

  useEffect(() => {
    if (!isEditMode || !courseId) return;

    let active = true;
    getCourseById(courseId)
      .then((course) => {
        if (!active) return;
        if (!course) {
          setFormError("Curso nao encontrado.");
          return;
        }

        reset({
          name: course.name ?? "",
          code: course.code ?? "",
          type: (course.type as (typeof COURSE_TYPES)[number]) ?? "OTHER",
          status: (course.status as (typeof COURSE_STATUS)[number]) ?? "DRAFT",
          description: course.description ?? "",
          startDate: course.startDate ?? "",
          endDate: course.endDate ?? "",
          scheduleDescription: course.scheduleDescription ?? "",
          capacity: course.capacity ? String(course.capacity) : "",
          workload: course.workload ? String(course.workload) : "",
          notes: course.notes ?? ""
        });
      })
      .catch((error) => {
        if (!active) return;
        setFormError(mapCourseApiError(error));
      })
      .finally(() => {
        if (active) setIsLoadingCourse(false);
      });

    return () => {
      active = false;
    };
  }, [courseId, isEditMode, reset]);

  const submitLabel = useMemo(
    () => (isEditMode ? "Salvar alteracoes" : "Salvar"),
    [isEditMode]
  );

  async function onSubmit(values: CourseRegistrationSchema) {
    try {
      setFormError(null);
      setSuccessMessage(null);

      const input: CourseUpsertInput = {
        name: values.name.trim(),
        type: values.type,
        status: values.status,
        code: normalizeOptional(values.code),
        description: normalizeOptional(values.description),
        startDate: normalizeOptional(values.startDate),
        endDate: normalizeOptional(values.endDate),
        scheduleDescription: normalizeOptional(values.scheduleDescription),
        capacity: normalizeOptional(values.capacity) ? Number(values.capacity) : undefined,
        workload: normalizeOptional(values.workload) ? Number(values.workload) : undefined,
        notes: normalizeOptional(values.notes)
      };

      if (isEditMode && courseId) {
        await updateCourse(courseId, input);
        setSuccessMessage("Curso atualizado com sucesso.");
      } else {
        await createCourse(input);
        setSuccessMessage("Curso criado com sucesso.");
      }

      window.setTimeout(() => router.push("/cursos/pesquisa"), 1200);
    } catch (error) {
      setFormError(mapCourseApiError(error));
    }
  }

  async function handleDelete() {
    if (!courseId) return;
    const confirmed = window.confirm("Deseja excluir este curso?");
    if (!confirmed) return;

    try {
      setIsDeletingCourse(true);
      await deleteCourse(courseId);
      setSuccessMessage("Curso excluido com sucesso.");
      window.setTimeout(() => router.push("/cursos/pesquisa"), 900);
    } catch (error) {
      setFormError(mapCourseApiError(error));
    } finally {
      setIsDeletingCourse(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            <span className="font-mono text-base font-medium uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
              Cursos
            </span>{" "}
            <span aria-hidden="true" className="text-[var(--color-muted-foreground)]">
              |
            </span>{" "}
            <span className="text-xl">{isEditMode ? "Editar curso" : "Novo curso"}</span>
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Cadastro de cursos com validacoes e integracao GraphQL.
          </p>
        </div>
      </section>

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

      <form className="space-y-6" id="course-form" onSubmit={handleSubmit(onSubmit)}>
        {isLoadingCourse ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-[var(--color-muted-foreground)]">
              <Loader2 className="size-4 animate-spin" />
              Carregando dados do curso...
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Identificacao</CardTitle>
            <CardDescription>Campos obrigatorios e informacoes principais do curso.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="course-name">Nome do curso</FieldLabel>
              <Input id="course-name" maxLength={300} {...register("name")} />
              {errors.name ? <FieldMessage className="text-red-600">{errors.name.message}</FieldMessage> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="course-code">Codigo</FieldLabel>
              <Input id="course-code" placeholder="ex: ENG-A1-2025" {...register("code")} />
              {errors.code ? <FieldMessage className="text-red-600">{errors.code.message}</FieldMessage> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="course-type">Tipo</FieldLabel>
              <select
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                id="course-type"
                {...register("type")}
              >
                {COURSE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {courseTypeLabels[type]}
                  </option>
                ))}
              </select>
              {errors.type ? <FieldMessage className="text-red-600">{errors.type.message}</FieldMessage> : null}
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="course-description">Descricao</FieldLabel>
              <textarea
                className="min-h-24 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                id="course-description"
                {...register("description")}
              />
              {errors.description ? <FieldMessage className="text-red-600">{errors.description.message}</FieldMessage> : null}
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programacao</CardTitle>
            <CardDescription>Datas e horario do curso.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="course-start-date">Inicio</FieldLabel>
              <Input id="course-start-date" type="date" {...register("startDate")} />
              {errors.startDate ? <FieldMessage className="text-red-600">{errors.startDate.message}</FieldMessage> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="course-end-date">Fim</FieldLabel>
              <Input id="course-end-date" type="date" {...register("endDate")} />
              {errors.endDate ? <FieldMessage className="text-red-600">{errors.endDate.message}</FieldMessage> : null}
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="course-schedule-description">Horario</FieldLabel>
              <Input
                id="course-schedule-description"
                placeholder="ex: Seg e Qua, 14h-16h"
                {...register("scheduleDescription")}
              />
              {errors.scheduleDescription ? (
                <FieldMessage className="text-red-600">{errors.scheduleDescription.message}</FieldMessage>
              ) : null}
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacidade</CardTitle>
            <CardDescription>Defina vagas e carga horaria.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="course-capacity">Vagas</FieldLabel>
              <Input id="course-capacity" inputMode="numeric" {...register("capacity")} />
              {errors.capacity ? <FieldMessage className="text-red-600">{errors.capacity.message}</FieldMessage> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="course-workload">Carga Horaria (horas)</FieldLabel>
              <Input id="course-workload" inputMode="numeric" {...register("workload")} />
              {errors.workload ? <FieldMessage className="text-red-600">{errors.workload.message}</FieldMessage> : null}
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status e observacoes</CardTitle>
            <CardDescription>Defina o status e mantenha anotacoes internas do curso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="course-status">Status</FieldLabel>
              <select
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                id="course-status"
                {...register("status")}
              >
                {COURSE_STATUS.map((courseStatus) => (
                  <option key={courseStatus} value={courseStatus}>
                    {statusLabels[courseStatus] ?? courseStatus}
                  </option>
                ))}
              </select>
              {errors.status ? <FieldMessage className="text-red-600">{errors.status.message}</FieldMessage> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="course-notes">Observacoes internas</FieldLabel>
              <textarea
                className="min-h-24 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                id="course-notes"
                {...register("notes")}
              />
              {errors.notes ? <FieldMessage className="text-red-600">{errors.notes.message}</FieldMessage> : null}
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          {isEditMode ? (
            <Button
              disabled={isDeletingCourse || isSubmitting || isLoadingCourse}
              onClick={handleDelete}
              size="lg"
              type="button"
              variant="ghost"
            >
              {isDeletingCourse ? "Excluindo..." : "Excluir"}
            </Button>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            <Button
              disabled={isLoadingCourse || isDeletingCourse}
              onClick={() => router.push("/cursos/pesquisa")}
              size="lg"
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={isLoadingCourse || isDeletingCourse}
              leadingIcon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              size="lg"
              type="submit"
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
