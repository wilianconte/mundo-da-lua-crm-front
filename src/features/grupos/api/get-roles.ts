import { gqlRequest } from "@/lib/graphql/client";

const GET_ROLES_QUERY = `
  query GetRoles(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: RoleFilterInput
    $order: [RoleSortInput!]
  ) {
    roles(
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
        description
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

export type RoleNode = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type RolesConnection = {
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  nodes: RoleNode[];
};

type GetRolesResponse = {
  roles: RolesConnection;
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

export type RoleFilterInput = {
  or?: Array<{
    name?: StringFilter;
    description?: StringFilter;
  }>;
  name?: StringFilter;
  description?: StringFilter;
  isActive?: BooleanFilter;
};

export type GetRolesVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: RoleFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

export async function getRoles(variables: GetRolesVariables) {
  const data = await gqlRequest<GetRolesResponse, GetRolesVariables>(GET_ROLES_QUERY, variables);
  return data.roles;
}