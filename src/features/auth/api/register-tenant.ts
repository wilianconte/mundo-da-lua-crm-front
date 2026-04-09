import { gqlRequest } from "@/lib/graphql/client";

const REGISTER_TENANT_MUTATION = `
  mutation RegisterTenant($input: RegisterTenantInput!) {
    registerTenant(input: $input) {
      tenant {
        id
        name
      }
    }
  }
`;

export type RegisterTenantInput = {
  companyLegalName: string;
  companyCnpj?: string;
  companyEmail?: string;
  companyPhone?: string;
  adminName: string;
  adminEmail: string;
  adminCpf?: string;
  adminPhone?: string;
  password: string;
  passwordConfirmation: string;
};

type RegisterTenantMutationResponse = {
  registerTenant: {
    tenant: {
      id: string;
      name: string;
    };
  };
};

export async function registerTenant(input: RegisterTenantInput) {
  const data = await gqlRequest<RegisterTenantMutationResponse, { input: RegisterTenantInput }>(
    REGISTER_TENANT_MUTATION,
    { input },
    { requiresAuth: false }
  );

  return data.registerTenant.tenant;
}
