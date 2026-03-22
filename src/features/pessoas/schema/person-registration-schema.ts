import { z } from "zod";

export const personRegistrationSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo."),
  preferredName: z.string().max(120, "Use no maximo 120 caracteres.").optional(),
  documentNumber: z.string().min(11, "Informe um CPF/CNPJ valido."),
  email: z.string().email("Informe um email valido."),
  primaryPhone: z.string().min(10, "Informe um telefone valido."),
  whatsAppNumber: z.string().min(10, "Informe um WhatsApp valido.").optional(),
  birthDate: z.string().min(1, "Informe a data de nascimento."),
  occupation: z.string().min(2, "Informe a profissao."),
  notes: z.string().max(300, "Use no maximo 300 caracteres.").optional()
});

export type PersonRegistrationSchema = z.infer<typeof personRegistrationSchema>;
