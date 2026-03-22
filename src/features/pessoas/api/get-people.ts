import { gqlRequest } from "@/lib/graphql/client";

const GET_PEOPLE_QUERY = `
  query GetPeople(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: PersonFilterInput
    $order: [PersonSortInput!]
  ) {
    people(
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
      totalCount
      nodes {
        id
        fullName
        email
        documentNumber
        primaryPhone
        status
        createdAt
      }
    }
  }
`;

export type PersonStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type PersonNode = {
  id: string;
  fullName: string;
  email?: string | null;
  documentNumber?: string | null;
  primaryPhone?: string | null;
  status: PersonStatus;
  createdAt: string;
};

export type PeopleConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  totalCount: number;
  nodes: PersonNode[];
};

type GetPeopleResponse = {
  people: PeopleConnection;
};

type StringFilter = {
  eq?: string;
  neq?: string;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  in?: string[];
};

type EnumFilter = {
  eq?: string;
  neq?: string;
  in?: string[];
};

export type PersonFilterInput = {
  or?: Array<Record<string, StringFilter>>;
  fullName?: StringFilter;
  email?: StringFilter;
  documentNumber?: StringFilter;
  primaryPhone?: StringFilter;
  occupation?: StringFilter;
  status?: EnumFilter;
};

export type GetPeopleVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: PersonFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

export async function getPeople(variables: GetPeopleVariables) {
  const data = await gqlRequest<GetPeopleResponse, GetPeopleVariables>(GET_PEOPLE_QUERY, variables);
  return data.people;
}
