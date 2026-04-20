import { gqlRequest } from "@/lib/graphql/client";

export type TransactionType = "INCOME" | "EXPENSE";

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

type UUIDFilter = {
  eq?: string;
  neq?: string;
  in?: string[];
};

type DateTimeFilter = {
  eq?: string;
  gte?: string;
  lte?: string;
};

type EnumFilter = {
  eq?: TransactionType;
  neq?: TransactionType;
  in?: TransactionType[];
};

export type TransactionNode = {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  paymentMethodId: string;
  transactionDate: string;
  isReconciled: boolean;
  isDeleted: boolean;
  createdAt: string;
  wallet?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  paymentMethod?: { id: string; name: string } | null;
};

export type TransactionDto = {
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

export type TransactionsConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  edges: Array<{ cursor: string; node: TransactionNode }>;
  nodes: TransactionNode[];
  totalCount: number;
};

export type TransactionFilterInput = {
  description?: StringFilter;
  type?: EnumFilter;
  walletId?: UUIDFilter;
  categoryId?: UUIDFilter;
  paymentMethodId?: UUIDFilter;
  transactionDate?: DateTimeFilter;
  isReconciled?: BooleanFilter;
  isDeleted?: BooleanFilter;
  wallet?: {
    name?: StringFilter;
  };
  category?: {
    name?: StringFilter;
  };
  paymentMethod?: {
    name?: StringFilter;
  };
  and?: TransactionFilterInput[];
  or?: TransactionFilterInput[];
};

export type GetTransactionsVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: TransactionFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

export type GetTransactionsFilteredVariables = {
  walletId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  type?: TransactionType | null;
  categoryId?: string | null;
  paymentMethodId?: string | null;
};

type GetTransactionsResponse = {
  transactions: TransactionsConnection;
};

type GetTransactionsFilteredResponse = {
  transactionsFiltered: TransactionDto[];
};

const GET_TRANSACTIONS_QUERY = `
  query GetTransactions(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: TransactionFilterInput
    $order: [TransactionSortInput!]
  ) {
    transactions(
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
          walletId
          type
          amount
          description
          categoryId
          paymentMethodId
          transactionDate
          isReconciled
          isDeleted
          createdAt
          wallet { id name }
          category { id name }
          paymentMethod { id name }
        }
      }
      nodes {
        id
        walletId
        type
        amount
        description
        categoryId
        paymentMethodId
        transactionDate
        isReconciled
        isDeleted
        createdAt
        wallet { id name }
        category { id name }
        paymentMethod { id name }
      }
      totalCount
    }
  }
`;

const GET_TRANSACTIONS_FILTERED_QUERY = `
  query GetTransactionsFiltered(
    $walletId: UUID
    $startDate: DateTime
    $endDate: DateTime
    $type: TransactionType
    $categoryId: UUID
    $paymentMethodId: UUID
  ) {
    transactionsFiltered(
      walletId: $walletId
      startDate: $startDate
      endDate: $endDate
      type: $type
      categoryId: $categoryId
      paymentMethodId: $paymentMethodId
    ) {
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

export async function getTransactions(variables: GetTransactionsVariables): Promise<TransactionsConnection> {
  const where = variables.where ?? {};
  const defaultWhere: TransactionFilterInput = {
    ...where,
    isDeleted: where.isDeleted ?? { eq: false }
  };

  const data = await gqlRequest<GetTransactionsResponse, GetTransactionsVariables>(GET_TRANSACTIONS_QUERY, {
    ...variables,
    where: defaultWhere
  });

  return data.transactions;
}

export async function getTransactionsFiltered(
  variables: GetTransactionsFilteredVariables
): Promise<TransactionDto[]> {
  const data = await gqlRequest<GetTransactionsFilteredResponse, GetTransactionsFilteredVariables>(
    GET_TRANSACTIONS_FILTERED_QUERY,
    variables
  );

  return data.transactionsFiltered;
}
