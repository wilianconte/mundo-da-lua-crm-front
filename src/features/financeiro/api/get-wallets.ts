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

export type WalletNode = {
  id: string;
  name: string;
  initialBalance: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
};

export type WalletWithBalance = {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
  isActive: boolean;
  createdAt: string;
};

export type WalletsConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  edges: Array<{ cursor: string; node: WalletNode }>;
  nodes: WalletNode[];
  totalCount: number;
};

export type WalletFilterInput = {
  name?: StringFilter;
  isActive?: BooleanFilter;
  isDeleted?: BooleanFilter;
  id?: { eq?: string; neq?: string };
  and?: WalletFilterInput[];
  or?: WalletFilterInput[];
};

export type GetWalletsVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: WalletFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

type GetWalletsResponse = {
  wallets: WalletsConnection;
};

type GetWalletsWithBalanceResponse = {
  walletsWithBalance: WalletWithBalance[];
};

const GET_WALLETS_QUERY = `
  query GetWallets(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: WalletFilterInput
    $order: [WalletSortInput!]
  ) {
    wallets(
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
          initialBalance
          isActive
          isDeleted
          createdAt
        }
      }
      nodes {
        id
        name
        initialBalance
        isActive
        isDeleted
        createdAt
      }
      totalCount
    }
  }
`;

const GET_WALLETS_WITH_BALANCE_QUERY = `
  query GetWalletsWithBalance {
    walletsWithBalance {
      id
      name
      balance
      initialBalance
      isActive
      createdAt
    }
  }
`;

export async function getWallets(variables: GetWalletsVariables): Promise<WalletsConnection> {
  const where = variables.where ?? {};
  const defaultWhere: WalletFilterInput = {
    ...where,
    isDeleted: where.isDeleted ?? { eq: false }
  };

  const data = await gqlRequest<GetWalletsResponse, GetWalletsVariables>(GET_WALLETS_QUERY, {
    ...variables,
    where: defaultWhere
  });

  return data.wallets;
}

export async function getWalletsWithBalance(): Promise<WalletWithBalance[]> {
  const data = await gqlRequest<GetWalletsWithBalanceResponse>(GET_WALLETS_WITH_BALANCE_QUERY);
  return data.walletsWithBalance;
}
