import { z } from "zod";

const GENDERS = ["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY", "OTHER"] as const;
const MARITAL_STATUS = [
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
  "SEPARATED",
  "STABLE_UNION"
] as const;

const MIN_BIRTH_DATE = new Date("1900-01-01T00:00:00.000Z");

function parseDateOnly(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export const personRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo.").max(300, "Use no maximo 300 caracteres."),
  preferredName: z.string().trim().max(150, "Use no maximo 150 caracteres.").optional(),
  documentNumber: z.string().trim().max(20, "Use no maximo 20 caracteres.").optional(),
  birthDate: z
    .string()
    .optional()
    .refine((value) => !value || Boolean(parseDateOnly(value)), "Informe uma data valida.")
    .refine((value) => {
      if (!value) return true;
      const parsed = parseDateOnly(value);
      if (!parsed) return false;
      return parsed >= MIN_BIRTH_DATE;
    }, "A data nao pode ser anterior a 1900.")
    .refine((value) => {
      if (!value) return true;
      const parsed = parseDateOnly(value);
      if (!parsed) return false;
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      return parsed <= today;
    }, "A data de nascimento nao pode ser futura."),
  gender: z.enum(GENDERS).optional(),
  maritalStatus: z.enum(MARITAL_STATUS).optional(),
  nationality: z.string().trim().max(100, "Use no maximo 100 caracteres.").optional(),
  occupation: z.string().trim().max(150, "Use no maximo 150 caracteres.").optional(),
  email: z
    .union([z.literal(""), z.string().trim().email("Informe um email valido.").max(254, "Use no maximo 254 caracteres.")])
    .optional(),
  primaryPhone: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
  secondaryPhone: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
  whatsAppNumber: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
  profileImageUrl: z
    .union([z.literal(""), z.string().trim().url("Informe uma URL valida.").max(2000, "Use no maximo 2000 caracteres.")])
    .optional(),
  notes: z.string().trim().max(2000, "Use no maximo 2000 caracteres.").optional()
})
  .transform((values) => ({
    ...values,
    preferredName: values.preferredName || undefined,
    documentNumber: values.documentNumber || undefined,
    birthDate: values.birthDate || undefined,
    gender: values.gender || undefined,
    maritalStatus: values.maritalStatus || undefined,
    nationality: values.nationality || undefined,
    occupation: values.occupation || undefined,
    email: values.email || undefined,
    primaryPhone: values.primaryPhone || undefined,
    secondaryPhone: values.secondaryPhone || undefined,
    whatsAppNumber: values.whatsAppNumber || undefined,
    profileImageUrl: values.profileImageUrl || undefined,
    notes: values.notes || undefined
  }));

export type PersonRegistrationSchema = z.infer<typeof personRegistrationSchema>;
