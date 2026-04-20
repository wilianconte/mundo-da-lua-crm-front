import { gqlRequest } from "@/lib/graphql/client";

type StringFilter = {
  eq?: string;
  neq?: string;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  in?: string[];
};

type BooleanFilter = {
  eq?: boolean;
  neq?: boolean;
};

export type PaymentMethodNode = {
  id: string;
  name: string;
  walletId: string;
  wallet?: { id: string; name: string } | null;
  isDeleted: boolean;
  createdAt: string;
};

export type PaymentMethodsConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  edges: Array<{ cursor: string; node: PaymentMethodNode }>;
  nodes: PaymentMethodNode[];
  totalCount: number;
};

export type PaymentMethodFilterInput = {
  name?: StringFilter;
  isDeleted?: BooleanFilter;
  id?: { eq?: string; neq?: string };
  walletId?: { eq?: string; neq?: string };
  and?: PaymentMethodFilterInput[];
  or?: PaymentMethodFilterInput[];
};

export type GetPaymentMethodsVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: PaymentMethodFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

type GetPaymentMethodsResponse = {
  paymentMethods: PaymentMethodsConnection;
};

const GET_PAYMENT_METHODS_QUERY = `
  query GetPaymentMethods(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: PaymentMethodFilterInput
    $order: [PaymentMethodSortInput!]
  ) {
    paymentMethods(
      first: $first
      after: $after
      last: $last
      before: $before
      where: $where
      order: $order
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          walletId
          isDeleted
          createdAt
          wallet {
            id
            name
          }
        }
      }
      nodes {
        id
        name
        walletId
        isDeleted
        createdAt
        wallet {
          id
          name
        }
      }
      totalCount
    }
  }
`;

export async function getPaymentMethods(
  variables: GetPaymentMethodsVariables
): Promise<PaymentMethodsConnection> {
  const where = variables.where ?? {};
  const defaultWhere: PaymentMethodFilterInput = {
    ...where,
    isDeleted: where.isDeleted ?? { eq: false }
  };

  const data = await gqlRequest<GetPaymentMethodsResponse, GetPaymentMethodsVariables>(
    GET_PAYMENT_METHODS_QUERY,
    {
      ...variables,
      where: defaultWhere
    }
  );

  return data.paymentMethods;
}
