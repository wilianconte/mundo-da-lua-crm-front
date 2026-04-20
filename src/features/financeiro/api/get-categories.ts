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

export type CategoryNode = {
  id: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
};

export type CategoriesConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  edges: Array<{ cursor: string; node: CategoryNode }>;
  nodes: CategoryNode[];
  totalCount: number;
};

export type CategoryFilterInput = {
  name?: StringFilter;
  isDeleted?: BooleanFilter;
  id?: { eq?: string; neq?: string };
  and?: CategoryFilterInput[];
  or?: CategoryFilterInput[];
};

export type GetCategoriesVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: CategoryFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

type GetCategoriesResponse = {
  categories: CategoriesConnection;
};

const GET_CATEGORIES_QUERY = `
  query GetCategories(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: CategoryFilterInput
    $order: [CategorySortInput!]
  ) {
    categories(
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
          isDeleted
          createdAt
        }
      }
      nodes {
        id
        name
        isDeleted
        createdAt
      }
      totalCount
    }
  }
`;

export async function getCategories(variables: GetCategoriesVariables): Promise<CategoriesConnection> {
  const where = variables.where ?? {};
  const defaultWhere: CategoryFilterInput = {
    ...where,
    isDeleted: where.isDeleted ?? { eq: false }
  };

  const data = await gqlRequest<GetCategoriesResponse, GetCategoriesVariables>(GET_CATEGORIES_QUERY, {
    ...variables,
    where: defaultWhere
  });

  return data.categories;
}
