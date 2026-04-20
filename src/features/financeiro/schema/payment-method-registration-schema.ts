import { z } from "zod";

export const paymentMethodRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  walletId: z.string().uuid("Selecione uma carteira valida")
});

export type PaymentMethodRegistrationSchema = z.infer<typeof paymentMethodRegistrationSchema>;
