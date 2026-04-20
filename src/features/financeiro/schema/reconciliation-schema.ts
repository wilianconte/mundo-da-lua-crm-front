import { z } from "zod";

export const reconciliationSchema = z.object({
  transactionId: z.string().uuid(),
  externalId: z.string().trim().min(1, "ID externo e obrigatorio"),
  externalAmount: z.coerce.number().positive("Valor externo deve ser maior que zero"),
  externalDate: z.string().min(1, "Data externa e obrigatoria")
});

export type ReconciliationSchema = z.infer<typeof reconciliationSchema>;
