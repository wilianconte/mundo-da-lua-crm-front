import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const RECONCILE_TRANSACTION_MUTATION = `
  mutation ReconcileTransaction($input: ReconcileTransactionInput!) {
    reconcileTransaction(input: $input) {
      reconciliation {
        id
        transactionId
        externalId
        externalAmount
        externalDate
        matchedAt
        createdAt
      }
    }
  }
`;

export type ReconciliationResult = {
  id: string;
  transactionId: string;
  externalId: string;
  externalAmount: number;
  externalDate: string;
  matchedAt: string;
  createdAt: string;
};

type ReconcileTransactionResponse = {
  reconcileTransaction: {
    reconciliation: ReconciliationResult;
  };
};

export async function reconcileTransaction(input: {
  transactionId: string;
  externalId: string;
  externalAmount: number;
  externalDate: string;
}): Promise<ReconciliationResult> {
  const data = await gqlRequest<ReconcileTransactionResponse, { input: typeof input }>(
    RECONCILE_TRANSACTION_MUTATION,
    { input }
  );

  return data.reconcileTransaction.reconciliation;
}

const RECONCILIATION_ERROR_MESSAGES: Record<string, string> = {
  TRANSACTION_RECONCILED: "Esta transacao ja foi conciliada.",
  TRANSACTION_NOT_FOUND: "Transacao nao encontrada."
};

export function mapReconciliationApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && RECONCILIATION_ERROR_MESSAGES[error.code]) {
      return RECONCILIATION_ERROR_MESSAGES[error.code];
    }

    return error.message || "Nao foi possivel conciliar a transacao.";
  }

  return "Nao foi possivel conciliar a transacao.";
}
