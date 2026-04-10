import { gqlRequest } from "@/lib/graphql/client";

const GET_USERS_QUERY = `
  query GetUsers(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: UserFilterInput
    $order: [UserSortInput!]
  ) {
    users(
      first: $first
      after: $after
      last: $last
      before: $before
      where: $where
      order: $order
    ) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        name
        email
        isAdmin
        isActive
        personId
        createdAt
        updatedAt
        createdBy
        updatedBy
      }
    }
  }
`;

export type UserNode = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  personId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UsersConnection = {
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  nodes: UserNode[];
};

type GetUsersResponse = {
  users: UsersConnection;
};

type StringFilter = {
  eq?: string;
  neq?: string;
  contains?: string;
  startsWith?: string;
  in?: string[];
};

type BooleanFilter = {
  eq?: boolean;
  neq?: boolean;
};

type NullableUuidFilter = {
  eq?: string | null;
  neq?: string | null;
};

export type UserFilterInput = {
  or?: Array<{
    name?: StringFilter;
    email?: StringFilter;
  }>;
  name?: StringFilter;
  email?: StringFilter;
  isActive?: BooleanFilter;
  isAdmin?: BooleanFilter;
  personId?: NullableUuidFilter;
};

export type GetUsersVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: UserFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

export async function getUsers(variables: GetUsersVariables) {
  const data = await gqlRequest<GetUsersResponse, GetUsersVariables>(GET_USERS_QUERY, variables);
  return data.users;
}
