import { z } from "zod";

export const studentFormSchema = z.object({
  personId: z.string().min(1, "Selecione uma pessoa."),
  status: z.enum(["ACTIVE", "PENDING", "INACTIVE"]),
  notes: z.string().optional()
});

export type StudentFormSchema = z.infer<typeof studentFormSchema>;
