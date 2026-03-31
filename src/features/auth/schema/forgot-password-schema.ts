import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido.")
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

