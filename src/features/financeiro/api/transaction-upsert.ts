import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";
import type { TransactionType } from "./get-transactions";

const GET_TRANSACTION_BY_ID_QUERY = `
  query GetTransactionById($id: UUID!) {
    transactionById(id: $id) {
      id
      walletId
      categoryId
      paymentMethodId
      type
      amount
      description
      transactionDate
      isReconciled
      createdAt
      updatedAt
    }
  }
`;

const CREATE_TRANSACTION_MUTATION = `
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      transaction {
        id
        walletId
        categoryId
        paymentMethodId
        type
        amount
        description
        transactionDate
        isReconciled
        createdAt
        updatedAt
      }
    }
  }
`;

const UPDATE_TRANSACTION_MUTATION = `
  mutation UpdateTransaction($id: UUID!, $input: UpdateTransactionInput!) {
    updateTransaction(id: $id, input: $input) {
      transaction {
        id
        walletId
        categoryId
        paymentMethodId
        type
        amount
        description
        transactionDate
        isReconciled
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_TRANSACTION_MUTATION = `
  mutation DeleteTransaction($id: UUID!) {
    deleteTransaction(id: $id)
  }
`;

export type TransactionRecord = {
  id: string;
  walletId: string;
  categoryId: string;
  paymentMethodId: string;
  type: TransactionType;
  amount: number;
  description: string;
  transactionDate: string;
  isReconciled: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

type GetTransactionByIdResponse = {
  transactionById: TransactionRecord | null;
};

type TransactionPayloadResponse = {
  transaction: TransactionRecord;
};

type CreateTransactionResponse = {
  createTransaction: TransactionPayloadResponse;
};

type UpdateTransactionResponse = {
  updateTransaction: TransactionPayloadResponse;
};

type DeleteTransactionResponse = {
  deleteTransaction: boolean;
};

export async function getTransactionById(id: string): Promise<TransactionRecord> {
  const data = await gqlRequest<GetTransactionByIdResponse, { id: string }>(GET_TRANSACTION_BY_ID_QUERY, { id });

  if (!data.transactionById) {
    throw new GraphQLRequestError("Transacao nao encontrada.", "TRANSACTION_NOT_FOUND");
  }

  return data.transactionById;
}

export async function createTransaction(input: {
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  paymentMethodId: string;
  transactionDate: string;
}): Promise<TransactionRecord> {
  const data = await gqlRequest<CreateTransactionResponse, { input: typeof input }>(
    CREATE_TRANSACTION_MUTATION,
    { input }
  );

  return data.createTransaction.transaction;
}

export async function updateTransaction(
  id: string,
  input: {
    amount: number;
    description: string;
    categoryId: string;
    paymentMethodId: string;
    transactionDate: string;
  }
): Promise<TransactionRecord> {
  const data = await gqlRequest<UpdateTransactionResponse, { id: string; input: typeof input }>(
    UPDATE_TRANSACTION_MUTATION,
    { id, input }
  );

  return data.updateTransaction.transaction;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const data = await gqlRequest<DeleteTransactionResponse, { id: string }>(DELETE_TRANSACTION_MUTATION, { id });
  return data.deleteTransaction;
}

const TRANSACTION_ERROR_MESSAGES: Record<string, string> = {
  TRANSACTION_RECONCILED: "Transacao conciliada nao pode ser alterada.",
  CATEGORY_NOT_FOUND: "Categoria nao encontrada.",
  PAYMENT_METHOD_NOT_FOUND: "Metodo de pagamento nao encontrado.",
  WALLET_NOT_FOUND: "Carteira nao encontrada.",
  WALLET_INACTIVE: "Carteira inativa. Selecione outra.",
  PAYMENT_METHOD_INACTIVE: "Metodo de pagamento inativo."
};

export function mapTransactionApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && TRANSACTION_ERROR_MESSAGES[error.code]) {
      return TRANSACTION_ERROR_MESSAGES[error.code];
    }

    return error.message || "Nao foi possivel salvar os dados da transacao.";
  }

  return "Nao foi possivel salvar os dados da transacao.";
}
