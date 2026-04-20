import { z } from "zod";

export const transferRegistrationSchema = z
  .object({
    fromWalletId: z.string().uuid("Selecione a carteira de origem"),
    toWalletId: z.string().uuid("Selecione a carteira de destino"),
    amount: z.coerce.number().positive("Valor deve ser maior que zero"),
    description: z.string().trim().min(1, "Descricao e obrigatoria"),
    categoryId: z.string().uuid("Selecione uma categoria valida"),
    paymentMethodId: z.string().uuid("Selecione um metodo de pagamento valido"),
    transactionDate: z.string().min(1, "Data e obrigatoria")
  })
  .refine((data) => data.fromWalletId !== data.toWalletId, {
    message: "A carteira de origem deve ser diferente da carteira de destino",
    path: ["toWalletId"]
  });

export type TransferRegistrationSchema = z.infer<typeof transferRegistrationSchema>;
