import { z } from "zod";

export const userRegistrationSchema = z
  .object({
    email: z.string().trim().email("Informe um email valido.").max(254, "Use no maximo 254 caracteres."),
    password: z.union([z.literal(""), z.string().max(128, "A senha deve ter no maximo 128 caracteres.")]),
    confirmPassword: z.union([z.literal(""), z.string().max(128, "A confirmacao deve ter no maximo 128 caracteres.")]),
    isAdmin: z.boolean(),
    isActive: z.boolean(),
    personId: z.string().trim().min(1, "Selecione uma pessoa."),
    groups: z.array(z.string()).optional()
  })
  .superRefine((values, ctx) => {
    const hasPassword = Boolean(values.password);
    const hasConfirmPassword = Boolean(values.confirmPassword);

    if (hasPassword && !hasConfirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Confirme a senha."
      });
      return;
    }

    if (!hasPassword && hasConfirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Informe a senha."
      });
      return;
    }

    if (hasPassword && values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "A confirmacao de senha deve ser igual a senha."
      });
    }
  })
  .transform((values) => ({
    ...values,
    personId: values.personId || undefined,
    groups: values.groups ?? []
  }));

export type UserRegistrationSchema = z.infer<typeof userRegistrationSchema>;
