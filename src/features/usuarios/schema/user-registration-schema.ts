import { z } from "zod";

export const userRegistrationSchema = z
  .object({
    email: z.string().trim().email("Informe um email valido.").max(254, "Use no maximo 254 caracteres."),
    password: z
      .string()
      .min(1, "Informe a senha.")
      .max(128, "A senha deve ter no maximo 128 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a senha."),
    isActive: z.boolean(),
    personId: z.string().trim().min(1, "Selecione uma pessoa."),
    groups: z.array(z.string()).optional()
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "A confirmacao de senha deve ser igual a senha."
  })
  .transform((values) => ({
    ...values,
    personId: values.personId || undefined,
    groups: values.groups ?? []
  }));

export type UserRegistrationSchema = z.infer<typeof userRegistrationSchema>;
