import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";
import type { TenantStatus } from "./get-tenants";

const GET_TENANT_BY_ID_QUERY = `
  query GetTenantById($id: UUID!) {
    tenantById(id: $id) {
      id
      name
      companyId
      ownerPersonId
      status
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_TENANT_MUTATION = `
  mutation UpdateTenant($id: UUID!, $input: UpdateTenantInput!) {
    updateTenant(id: $id, input: $input) {
      tenant {
        id
        name
        companyId
        ownerPersonId
        status
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_TENANT_MUTATION = `
  mutation DeleteTenant($id: UUID!) {
    deleteTenant(id: $id)
  }
`;

const GET_COMPANY_BY_ID_QUERY = `
  query GetCompanyByIdForTenant($id: UUID!) {
    companyById(id: $id) {
      id
      legalName
      tradeName
    }
  }
`;

export type TenantRecord = {
  id: string;
  name: string;
  companyId: string;
  ownerPersonId?: string | null;
  status: TenantStatus;
  createdAt: string;
  updatedAt?: string | null;
};

export type TenantCompanyLink = {
  id: string;
  legalName: string;
  tradeName?: string | null;
};

export type TenantUpdateInput = {
  name: string;
  status: TenantStatus;
};

type GetTenantByIdResponse = {
  tenantById: TenantRecord | null;
};

type UpdateTenantResponse = {
  updateTenant: {
    tenant: TenantRecord;
  };
};

type DeleteTenantResponse = {
  deleteTenant: boolean;
};

type GetCompanyByIdResponse = {
  companyById: TenantCompanyLink | null;
};

export async function getTenantById(id: string) {
  const data = await gqlRequest<GetTenantByIdResponse, { id: string }>(GET_TENANT_BY_ID_QUERY, { id });
  return data.tenantById;
}

export async function updateTenant(id: string, input: TenantUpdateInput) {
  const data = await gqlRequest<UpdateTenantResponse, { id: string; input: TenantUpdateInput }>(
    UPDATE_TENANT_MUTATION,
    { id, input }
  );

  return data.updateTenant.tenant;
}

export async function deleteTenant(id: string) {
  const data = await gqlRequest<DeleteTenantResponse, { id: string }>(DELETE_TENANT_MUTATION, { id });
  return data.deleteTenant;
}

export async function getTenantCompanyById(companyId: string) {
  const data = await gqlRequest<GetCompanyByIdResponse, { id: string }>(GET_COMPANY_BY_ID_QUERY, {
    id: companyId
  });
  return data.companyById;
}

const TENANT_ERROR_MESSAGES: Record<string, string> = {
  TENANT_NOT_FOUND: "Tenant nao encontrado.",
  COMPANY_NOT_FOUND: "Empresa vinculada nao encontrada."
};

export function mapTenantApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && TENANT_ERROR_MESSAGES[error.code]) {
      return TENANT_ERROR_MESSAGES[error.code];
    }

    if (error.code === "VALIDATION_ERROR") {
      return error.message;
    }

    return error.message || "Nao foi possivel salvar os dados do tenant.";
  }

  return "Nao foi possivel salvar os dados do tenant.";
}
