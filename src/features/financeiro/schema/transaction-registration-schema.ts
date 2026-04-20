import { z } from "zod";

export const transactionTypeValues = ["INCOME", "EXPENSE"] as const;
export type TransactionType = (typeof transactionTypeValues)[number];

export const transactionRegistrationSchema = z.object({
  type: z.enum(transactionTypeValues, { required_error: "Selecione o tipo de transacao" }),
  walletId: z.string().uuid("Selecione uma carteira valida"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  description: z.string().trim().min(1, "Descricao e obrigatoria"),
  categoryId: z.string().uuid("Selecione uma categoria valida"),
  paymentMethodId: z.string().uuid("Selecione um metodo de pagamento valido"),
  transactionDate: z.string().min(1, "Data e obrigatoria")
});

export type TransactionRegistrationSchema = z.infer<typeof transactionRegistrationSchema>;
