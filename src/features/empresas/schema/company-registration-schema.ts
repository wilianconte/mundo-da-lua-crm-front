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

const optionalEmail = z
  .union([z.literal(""), z.string().trim().email("Informe um email valido.").max(254, "Use no maximo 254 caracteres.")])
  .optional();

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("Informe uma URL valida.").max(2000, "Use no maximo 2000 caracteres.")])
  .optional();

const optionalCompanyType = z.union([z.literal(""), z.enum(COMPANY_TYPES)]).optional();

export const companyRegistrationSchema = z
  .object({
    legalName: z.string().trim().min(2, "Informe a razao social.").max(300, "Use no maximo 300 caracteres."),
    tradeName: z.string().trim().max(300, "Use no maximo 300 caracteres.").optional(),
    registrationNumber: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
    stateRegistration: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
    municipalRegistration: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
    email: optionalEmail,
    primaryPhone: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
    secondaryPhone: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
    whatsAppNumber: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
    website: z.union([z.literal(""), z.string().trim().max(500, "Use no maximo 500 caracteres.")]).optional()
      .refine((value) => !value || /^https?:\/\//i.test(value), "Informe uma URL iniciando com http:// ou https://."),
    contactPersonName: z.string().trim().max(300, "Use no maximo 300 caracteres.").optional(),
    contactPersonEmail: optionalEmail,
    contactPersonPhone: z.string().trim().max(30, "Use no maximo 30 caracteres.").optional(),
    companyType: optionalCompanyType,
    industry: z.string().trim().max(150, "Use no maximo 150 caracteres.").optional(),
    profileImageUrl: optionalUrl,
    notes: z.string().trim().max(2000, "Use no maximo 2000 caracteres.").optional(),
    street: z.string().trim().max(300, "Use no maximo 300 caracteres.").optional(),
    number: z.string().trim().max(20, "Use no maximo 20 caracteres.").optional(),
    complement: z.string().trim().max(100, "Use no maximo 100 caracteres.").optional(),
    neighborhood: z.string().trim().max(150, "Use no maximo 150 caracteres.").optional(),
    city: z.string().trim().max(150, "Use no maximo 150 caracteres.").optional(),
    state: z.string().trim().max(2, "Use 2 caracteres.").optional(),
    zipCode: z.string().trim().max(10, "Use no maximo 10 caracteres.").optional(),
    country: z.string().trim().max(2, "Use 2 caracteres.").optional()
  })
  .superRefine((values, ctx) => {
    const hasAddressValue = Boolean(
      values.street ||
        values.number ||
        values.complement ||
        values.neighborhood ||
        values.city ||
        values.state ||
        values.zipCode ||
        values.country
    );

    if (!hasAddressValue) {
      return;
    }

    if (!values.street) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a rua.", path: ["street"] });
    }
    if (!values.neighborhood) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o bairro.", path: ["neighborhood"] });
    }
    if (!values.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a cidade.", path: ["city"] });
    }
    if (!values.state || values.state.trim().length !== 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a UF com 2 letras.", path: ["state"] });
    }
    if (!values.zipCode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o CEP.", path: ["zipCode"] });
    }
    if (!values.country || values.country.trim().length !== 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o pais com 2 letras.", path: ["country"] });
    }
  })
  .transform((values) => ({
    ...values,
    tradeName: values.tradeName || undefined,
    registrationNumber: values.registrationNumber || undefined,
    stateRegistration: values.stateRegistration || undefined,
    municipalRegistration: values.municipalRegistration || undefined,
    email: values.email || undefined,
    primaryPhone: values.primaryPhone || undefined,
    secondaryPhone: values.secondaryPhone || undefined,
    whatsAppNumber: values.whatsAppNumber || undefined,
    website: values.website || undefined,
    contactPersonName: values.contactPersonName || undefined,
    contactPersonEmail: values.contactPersonEmail || undefined,
    contactPersonPhone: values.contactPersonPhone || undefined,
    companyType: values.companyType || undefined,
    industry: values.industry || undefined,
    profileImageUrl: values.profileImageUrl || undefined,
    notes: values.notes || undefined,
    street: values.street || undefined,
    number: values.number || undefined,
    complement: values.complement || undefined,
    neighborhood: values.neighborhood || undefined,
    city: values.city || undefined,
    state: values.state ? values.state.toUpperCase() : undefined,
    zipCode: values.zipCode || undefined,
    country: values.country ? values.country.toUpperCase() : undefined
  }));

export type CompanyRegistrationSchema = z.infer<typeof companyRegistrationSchema>;
