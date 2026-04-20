import { z } from "zod";

export const walletRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  initialBalance: z.coerce.number().min(0, "Saldo inicial nao pode ser negativo"),
  isActive: z.boolean().optional()
});

export type WalletRegistrationSchema = z.infer<typeof walletRegistrationSchema>;
