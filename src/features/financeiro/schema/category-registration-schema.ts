import { z } from "zod";

export const categoryRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres")
});

export type CategoryRegistrationSchema = z.infer<typeof categoryRegistrationSchema>;
