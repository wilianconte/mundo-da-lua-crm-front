import { z } from "zod";

export const tenantRegistrationSchema = z.object({
  name: z
    .string({ required_error: "Informe o nome do tenant." })
    .trim()
    .min(2, "Informe ao menos 2 caracteres para o nome do tenant.")
    .max(120, "O nome do tenant deve ter no maximo 120 caracteres."),
  status: z.enum(["ACTIVE", "SUSPENDED", "CANCELLED"], {
    required_error: "Selecione o status."
  })
});

export type TenantRegistrationSchema = z.infer<typeof tenantRegistrationSchema>;
