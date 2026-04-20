import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const CREATE_TRANSFER_MUTATION = `
  mutation CreateTransfer($input: CreateTransferInput!) {
    createTransfer(input: $input) {
      expenseTransaction {
        id
        type
        amount
        description
        transactionDate
        createdAt
      }
      incomeTransaction {
        id
        type
        amount
        description
        transactionDate
        createdAt
      }
    }
  }
`;

export type TransferResult = {
  expenseTransaction: {
    id: string;
    type: string;
    amount: number;
    description: string;
    transactionDate: string;
    createdAt: string;
  };
  incomeTransaction: {
    id: string;
    type: string;
    amount: number;
    description: string;
    transactionDate: string;
    createdAt: string;
  };
};

type CreateTransferResponse = {
  createTransfer: TransferResult;
};

export async function createTransfer(input: {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  description: string;
  categoryId: string;
  paymentMethodId: string;
  transactionDate: string;
}): Promise<TransferResult> {
  const data = await gqlRequest<CreateTransferResponse, { input: typeof input }>(CREATE_TRANSFER_MUTATION, {
    input
  });

  return data.createTransfer;
}

const TRANSFER_ERROR_MESSAGES: Record<string, string> = {
  WALLET_INSUFFICIENT_BALANCE: "Saldo insuficiente na carteira de origem.",
  WALLET_INACTIVE: "Uma das carteiras esta inativa.",
  SAME_WALLET_TRANSFER: "Nao e possivel transferir para a mesma carteira.",
  WALLET_NOT_FOUND: "Carteira nao encontrada.",
  CATEGORY_NOT_FOUND: "Categoria nao encontrada.",
  PAYMENT_METHOD_NOT_FOUND: "Metodo de pagamento nao encontrado."
};

export function mapTransferApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && TRANSFER_ERROR_MESSAGES[error.code]) {
      return TRANSFER_ERROR_MESSAGES[error.code];
    }

    return error.message || "Nao foi possivel concluir a transferencia.";
  }

  return "Nao foi possivel concluir a transferencia.";
}
