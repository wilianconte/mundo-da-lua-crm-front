import { gqlRequest } from "@/lib/graphql/client";

const GET_COMPANIES_QUERY = `
  query GetCompanies(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: CompanyFilterInput
    $order: [CompanySortInput!]
  ) {
    companies(
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
        legalName
        tradeName
        registrationNumber
        email
        primaryPhone
        companyType
        status
        createdAt
      }
    }
  }
`;

export type CompanyType =
  | "SUPPLIER"
  | "PARTNER"
  | "SCHOOL"
  | "CORPORATE_CUSTOMER"
  | "BILLING_ACCOUNT"
  | "SERVICE_PROVIDER"
  | "SPONSOR"
  | "OTHER";

export type CompanyStatus = "ACTIVE" | "INACTIVE" | "BLOCKED" | "SUSPENDED";

export type CompanyNode = {
  id: string;
  legalName: string;
  tradeName?: string | null;
  registrationNumber?: string | null;
  email?: string | null;
  primaryPhone?: string | null;
  companyType?: CompanyType | null;
  status: CompanyStatus;
  createdAt: string;
};

export type CompaniesConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  totalCount: number;
  nodes: CompanyNode[];
};

type GetCompaniesResponse = {
  companies: CompaniesConnection;
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

export type CompanyFilterInput = {
  or?: Array<Record<string, StringFilter>>;
  legalName?: StringFilter;
  tradeName?: StringFilter;
  registrationNumber?: StringFilter;
  email?: StringFilter;
  primaryPhone?: StringFilter;
  industry?: StringFilter;
  status?: EnumFilter;
  companyType?: EnumFilter;
};

export type GetCompaniesVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: CompanyFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

export async function getCompanies(variables: GetCompaniesVariables) {
  const data = await gqlRequest<GetCompaniesResponse, GetCompaniesVariables>(GET_COMPANIES_QUERY, variables);
  return data.companies;
}
