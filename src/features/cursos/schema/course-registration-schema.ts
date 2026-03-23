import { z } from "zod";

export const COURSE_TYPES = [
  "AFTER_SCHOOL",
  "LANGUAGE",
  "SCHOOL_CLASS",
  "WORKSHOP",
  "OTHER"
] as const;

export const COURSE_STATUS = ["DRAFT", "ACTIVE", "INACTIVE", "COMPLETED", "CANCELLED"] as const;

const optionalText = (max: number) =>
  z.union([z.literal(""), z.string().trim().max(max, `Use no maximo ${max} caracteres.`)]).optional();

const optionalPositiveIntegerText = z
  .union([z.literal(""), z.string().trim().regex(/^\d+$/, "Informe um numero inteiro positivo.")])
  .optional()
  .refine((value) => !value || Number(value) >= 1, "Informe um valor maior ou igual a 1.");

export const courseRegistrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome do curso.")
      .max(300, "Use no maximo 300 caracteres."),
    code: optionalText(100).refine(
      (value) => !value || /^[A-Za-z0-9-]+$/.test(value),
      "Use apenas letras, numeros e hifens."
    ),
    type: z.enum(COURSE_TYPES, { message: "Selecione o tipo do curso." }),
    status: z.enum(COURSE_STATUS, { message: "Selecione o status." }),
    description: optionalText(2000),
    startDate: z.union([z.literal(""), z.string().trim()]).optional(),
    endDate: z.union([z.literal(""), z.string().trim()]).optional(),
    scheduleDescription: optionalText(300),
    capacity: optionalPositiveIntegerText,
    workload: optionalPositiveIntegerText,
    notes: optionalText(2000)
  })
  .superRefine((values, ctx) => {
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data de termino deve ser maior ou igual a data de inicio.",
        path: ["endDate"]
      });
    }
  });

export type CourseRegistrationSchema = z.infer<typeof courseRegistrationSchema>;
