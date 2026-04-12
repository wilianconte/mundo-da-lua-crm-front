import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
    newPasswordConfirmation: z.string().min(1)
  })
  .refine((values) => values.newPassword === values.newPasswordConfirmation, {
    path: ["newPasswordConfirmation"],
    message: "As senhas n\u00e3o coincidem."
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
