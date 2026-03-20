import { z } from "zod";

export const clientRegistrationSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo."),
  email: z.string().email("Informe um email valido."),
  phone: z.string().min(10, "Informe um telefone valido."),
  document: z.string().min(11, "Informe um CPF/CNPJ valido."),
  birthDate: z.string().min(1, "Informe a data de nascimento."),
  city: z.string().min(2, "Informe a cidade."),
  state: z.string().length(2, "Use a sigla do estado."),
  address: z.string().min(5, "Informe o endereco completo."),
  notes: z.string().max(300, "Use no maximo 300 caracteres.").optional()
});

export type ClientRegistrationSchema = z.infer<typeof clientRegistrationSchema>;
