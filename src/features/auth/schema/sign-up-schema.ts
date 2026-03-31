import { z } from "zod";

const COMPANY_TYPES = [
  "SUPPLIER",
  "PARTNER",
  "SCHOOL",
  "CORPORATE_CUSTOMER",
  "BILLING_ACCOUNT",
  "SERVICE_PROVIDER",
  "SPONSOR",
  "OTHER"
] as const;

function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const calcDigit = (base: string, factor: number) => {
    let total = 0;
    for (const char of base) {
      total += Number(char) * factor;
      factor -= 1;
    }
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const first = calcDigit(digits.slice(0, 9), 10);
  const second = calcDigit(`${digits.slice(0, 9)}${first}`, 11);
  return digits === `${digits.slice(0, 9)}${first}${second}`;
}

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe o nome completo.").max(300, "Use no maximo 300 caracteres."),
    documentNumber: z
      .string()
      .trim()
      .min(1, "Informe o CPF.")
      .refine(isValidCpf, "Informe um CPF valido."),
    birthDate: z.string().optional(),
    personEmail: z.string().trim().email("Informe um e-mail valido."),
    personPhone: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
    legalName: z.string().trim().min(2, "Informe a razao social.").max(300, "Use no maximo 300 caracteres."),
    tradeName: z.string().trim().max(300, "Use no maximo 300 caracteres.").optional(),
    registrationNumber: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
    companyEmail: z
      .union([z.literal(""), z.string().trim().email("Informe um e-mail valido.")])
      .optional(),
    companyPhone: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
    companyType: z.union([z.literal(""), z.enum(COMPANY_TYPES)]).optional(),
    password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres.").max(128),
    confirmPassword: z.string().min(6, "A confirmacao precisa ter ao menos 6 caracteres.").max(128)
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "A confirmacao de senha deve ser igual a senha."
      });
    }
  })
  .transform((values) => ({
    ...values,
    documentNumber: values.documentNumber || undefined,
    birthDate: values.birthDate || undefined,
    personPhone: values.personPhone || undefined,
    tradeName: values.tradeName || undefined,
    registrationNumber: values.registrationNumber || undefined,
    companyEmail: values.companyEmail || undefined,
    companyPhone: values.companyPhone || undefined,
    companyType: values.companyType || undefined
  }));

export type SignUpSchema = z.infer<typeof signUpSchema>;
