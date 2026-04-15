import { gqlRequest } from "@/lib/graphql/client";

const GET_TENANTS_QUERY = `
  query GetTenants(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $where: TenantFilterInput
    $order: [TenantSortInput!]
  ) {
    tenants(
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
        name
        companyId
        ownerPersonId
        status
        createdAt
      }
    }
  }
`;

const GET_COMPANIES_BY_IDS_QUERY = `
  query GetCompaniesByIds($where: CompanyFilterInput, $first: Int) {
    companies(where: $where, first: $first) {
      nodes {
        id
        legalName
        tradeName
      }
    }
  }
`;

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED";

export type TenantNode = {
  id: string;
  name: string;
  companyId: string;
  ownerPersonId?: string | null;
  status: TenantStatus;
  createdAt: string;
};

export type TenantRow = TenantNode & {
  companyLegalName?: string | null;
  companyTradeName?: string | null;
};

export type TenantsConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  totalCount: number;
  nodes: TenantRow[];
};

type TenantStringFilter = {
  eq?: string;
  neq?: string;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  in?: string[];
};

type TenantUuidFilter = {
  eq?: string;
  neq?: string;
  in?: string[];
  nin?: string[];
};

type TenantEnumFilter = {
  eq?: string;
  neq?: string;
  in?: string[];
  nin?: string[];
};

type TenantBooleanFilter = {
  eq?: boolean;
  neq?: boolean;
};

export type TenantFilterInput = {
  or?: Array<Record<string, TenantStringFilter>>;
  name?: TenantStringFilter;
  companyId?: TenantUuidFilter;
  status?: TenantEnumFilter;
  isDeleted?: TenantBooleanFilter;
};

export type GetTenantsVariables = {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  where?: TenantFilterInput | null;
  order?: Array<Record<string, "ASC" | "DESC">>;
};

type TenantsResponse = {
  tenants: {
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
    totalCount: number;
    nodes: TenantNode[];
  };
};

type CompanyNode = {
  id: string;
  legalName: string;
  tradeName?: string | null;
};

type CompaniesByIdsResponse = {
  companies: {
    nodes: CompanyNode[];
  };
};

type GetCompaniesByIdsVariables = {
  where: {
    id: {
      in: string[];
    };
  };
  first: number;
};

export async function getTenants(variables: GetTenantsVariables): Promise<TenantsConnection> {
  const data = await gqlRequest<TenantsResponse, GetTenantsVariables>(GET_TENANTS_QUERY, variables);
  const tenantsConnection = data.tenants;
  const tenantNodes = tenantsConnection.nodes ?? [];

  if (!tenantNodes.length) {
    return {
      ...tenantsConnection,
      nodes: []
    };
  }

  const companyIds = Array.from(
    new Set(tenantNodes.map((tenant) => tenant.companyId).filter((companyId) => Boolean(companyId)))
  );

  if (!companyIds.length) {
    return {
      ...tenantsConnection,
      nodes: tenantNodes
    };
  }

  const companiesData = await gqlRequest<CompaniesByIdsResponse, GetCompaniesByIdsVariables>(
    GET_COMPANIES_BY_IDS_QUERY,
    {
      where: { id: { in: companyIds } },
      first: Math.max(companyIds.length, 1)
    }
  );

  const companyById = new Map(companiesData.companies.nodes.map((company) => [company.id, company]));

  return {
    ...tenantsConnection,
    nodes: tenantNodes.map((tenant) => {
      const linkedCompany = companyById.get(tenant.companyId);
      return {
        ...tenant,
        companyLegalName: linkedCompany?.legalName ?? null,
        companyTradeName: linkedCompany?.tradeName ?? null
      };
    })
  };
}
