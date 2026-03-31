import { z } from "zod";

const optionalText = (max: number) =>
  z.union([z.literal(""), z.string().trim().max(max, `Use no maximo ${max} caracteres.`)]).optional();

export const groupRegistrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do grupo.")
    .max(150, "Use no maximo 150 caracteres."),
  description: optionalText(500),
  isActive: z.boolean(),
  permissionIds: z
    .array(z.string().uuid("Permissao invalida."))
    .min(1, "Selecione pelo menos uma permissao para o grupo.")
    .default([])
});

export type GroupRegistrationSchema = z.infer<typeof groupRegistrationSchema>;
