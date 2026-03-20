import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um email valido."),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres.")
});

export type LoginSchema = z.infer<typeof loginSchema>;
