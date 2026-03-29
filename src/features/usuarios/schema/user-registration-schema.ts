import { z } from "zod";

const USER_STATUS = ["ACTIVE", "INACTIVE"] as const;

export const userRegistrationSchema = z
  .object({
    email: z.string().trim().email("Informe um email valido.").max(254, "Use no maximo 254 caracteres."),
    password: z
      .string()
      .min(8, "A senha deve ter no minimo 8 caracteres.")
      .max(100, "A senha deve ter no maximo 100 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a senha."),
    status: z.enum(USER_STATUS),
    personId: z.string().trim().min(1, "Selecione uma pessoa."),
    groups: z.array(z.string()).min(1, "Selecione pelo menos um grupo.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "A confirmacao de senha deve ser igual a senha."
  })
  .transform((values) => ({
    ...values
  }));

export type UserRegistrationSchema = z.infer<typeof userRegistrationSchema>;
