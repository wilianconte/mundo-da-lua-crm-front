import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const GET_PAYMENT_METHOD_BY_ID_QUERY = `
  query GetPaymentMethodById($id: UUID!) {
    paymentMethods(where: { id: { eq: $id }, isDeleted: { eq: false } }, first: 1) {
      nodes {
        id
        name
        walletId
        createdAt
        updatedAt
      }
    }
  }
`;

const CREATE_PAYMENT_METHOD_MUTATION = `
  mutation CreatePaymentMethod($input: CreatePaymentMethodInput!) {
    createPaymentMethod(input: $input) {
      paymentMethod {
        id
        name
        walletId
        createdAt
        updatedAt
      }
    }
  }
`;

const UPDATE_PAYMENT_METHOD_MUTATION = `
  mutation UpdatePaymentMethod($id: UUID!, $input: UpdatePaymentMethodInput!) {
    updatePaymentMethod(id: $id, input: $input) {
      paymentMethod {
        id
        name
        walletId
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_PAYMENT_METHOD_MUTATION = `
  mutation DeletePaymentMethod($id: UUID!) {
    deletePaymentMethod(id: $id)
  }
`;

export type PaymentMethodRecord = {
  id: string;
  name: string;
  walletId: string;
  createdAt: string;
  updatedAt?: string | null;
};

type GetPaymentMethodByIdResponse = {
  paymentMethods: {
    nodes: PaymentMethodRecord[];
  };
};

type CreatePaymentMethodResponse = {
  createPaymentMethod: {
    paymentMethod: PaymentMethodRecord;
  };
};

type UpdatePaymentMethodResponse = {
  updatePaymentMethod: {
    paymentMethod: PaymentMethodRecord;
  };
};

type DeletePaymentMethodResponse = {
  deletePaymentMethod: boolean;
};

export async function getPaymentMethodById(id: string): Promise<PaymentMethodRecord> {
  const data = await gqlRequest<GetPaymentMethodByIdResponse, { id: string }>(GET_PAYMENT_METHOD_BY_ID_QUERY, { id });
  const paymentMethod = data.paymentMethods.nodes[0];

  if (!paymentMethod) {
    throw new GraphQLRequestError("Metodo de pagamento nao encontrado.", "PAYMENT_METHOD_NOT_FOUND");
  }

  return paymentMethod;
}

export async function createPaymentMethod(input: {
  name: string;
  walletId: string;
}): Promise<PaymentMethodRecord> {
  const data = await gqlRequest<CreatePaymentMethodResponse, { input: { name: string; walletId: string } }>(
    CREATE_PAYMENT_METHOD_MUTATION,
    { input }
  );

  return data.createPaymentMethod.paymentMethod;
}

export async function updatePaymentMethod(
  id: string,
  input: { name: string }
): Promise<PaymentMethodRecord> {
  const data = await gqlRequest<UpdatePaymentMethodResponse, { id: string; input: { name: string } }>(
    UPDATE_PAYMENT_METHOD_MUTATION,
    { id, input }
  );

  return data.updatePaymentMethod.paymentMethod;
}

export async function deletePaymentMethod(id: string): Promise<boolean> {
  const data = await gqlRequest<DeletePaymentMethodResponse, { id: string }>(DELETE_PAYMENT_METHOD_MUTATION, { id });
  return data.deletePaymentMethod;
}

const PAYMENT_METHOD_ERROR_MESSAGES: Record<string, string> = {
  PAYMENT_METHOD_NAME_DUPLICATE: "Ja existe um metodo de pagamento com esse nome.",
  PAYMENT_METHOD_NOT_FOUND: "Metodo de pagamento nao encontrado.",
  WALLET_NOT_FOUND: "Carteira nao encontrada."
};

export function mapPaymentMethodApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && PAYMENT_METHOD_ERROR_MESSAGES[error.code]) {
      return PAYMENT_METHOD_ERROR_MESSAGES[error.code];
    }

    return error.message || "Nao foi possivel salvar os dados do metodo de pagamento.";
  }

  return "Nao foi possivel salvar os dados do metodo de pagamento.";
}
