import { z } from "zod";

export const studentFormSchema = z.object({
  personId: z.string().min(1, "Selecione uma pessoa."),
  registrationNumber: z.string().max(50, "Numero de matricula deve ter no maximo 50 caracteres.").optional(),
  schoolName: z.string().max(200, "Nome da escola deve ter no maximo 200 caracteres.").optional(),
  gradeOrClass: z.string().max(100, "Serie ou turma deve ter no maximo 100 caracteres.").optional(),
  enrollmentType: z.string().max(100, "Tipo de matricula deve ter no maximo 100 caracteres.").optional(),
  classGroup: z.string().max(100, "Turma deve ter no maximo 100 caracteres.").optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
  academicObservation: z.string().optional()
});

export type StudentFormSchema = z.infer<typeof studentFormSchema>;
