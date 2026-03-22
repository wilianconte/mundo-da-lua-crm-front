import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";
import type { CompanyStatus, CompanyType } from "./get-companies";

const GET_COMPANY_BY_ID_QUERY = `
  query GetCompanyById($id: UUID!) {
    companyById(id: $id) {
      id
      legalName
      tradeName
      registrationNumber
      stateRegistration
      municipalRegistration
      email
      primaryPhone
      secondaryPhone
      whatsAppNumber
      website
      contactPersonName
      contactPersonEmail
      contactPersonPhone
      companyType
      industry
      profileImageUrl
      status
      notes
      createdAt
      updatedAt
      address {
        street
        number
        complement
        neighborhood
        city
        state
        zipCode
        country
      }
    }
  }
`;

const CREATE_COMPANY_MUTATION = `
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
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
`;

const UPDATE_COMPANY_MUTATION = `
  mutation UpdateCompany($id: UUID!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      id
      legalName
      tradeName
      registrationNumber
      email
      primaryPhone
      companyType
      status
      updatedAt
    }
  }
`;

const SET_COMPANY_ADDRESS_MUTATION = `
  mutation SetCompanyAddress($input: SetCompanyAddressInput!) {
    setCompanyAddress(input: $input) {
      id
      updatedAt
      address {
        street
        number
        complement
        neighborhood
        city
        state
        zipCode
        country
      }
    }
  }
`;

const DELETE_COMPANY_MUTATION = `
  mutation DeleteCompany($id: UUID!) {
    deleteCompany(id: $id)
  }
`;

export type CompanyAddress = {
  street: string;
  number?: string | null;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export type CompanyRecord = {
  id: string;
  legalName: string;
  tradeName?: string | null;
  registrationNumber?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  email?: string | null;
  primaryPhone?: string | null;
  secondaryPhone?: string | null;
  whatsAppNumber?: string | null;
  website?: string | null;
  contactPersonName?: string | null;
  contactPersonEmail?: string | null;
  contactPersonPhone?: string | null;
  companyType?: CompanyType | null;
  industry?: string | null;
  profileImageUrl?: string | null;
  status: CompanyStatus;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  address?: CompanyAddress | null;
};

export type CompanyUpsertInput = {
  legalName: string;
  tradeName?: string;
  registrationNumber?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  email?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  whatsAppNumber?: string;
  website?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  companyType?: CompanyType;
  industry?: string;
  profileImageUrl?: string;
  notes?: string;
};

export type SetCompanyAddressInput = {
  companyId: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

type GetCompanyByIdResponse = {
  companyById: CompanyRecord | null;
};

type CreateCompanyResponse = {
  createCompany: CompanyRecord;
};

type UpdateCompanyResponse = {
  updateCompany: CompanyRecord;
};

type SetCompanyAddressResponse = {
  setCompanyAddress: CompanyRecord;
};

type DeleteCompanyResponse = {
  deleteCompany: boolean;
};

export async function getCompanyById(id: string) {
  const data = await gqlRequest<GetCompanyByIdResponse, { id: string }>(GET_COMPANY_BY_ID_QUERY, { id });
  return data.companyById;
}

export async function createCompany(input: CompanyUpsertInput) {
  const data = await gqlRequest<CreateCompanyResponse, { input: CompanyUpsertInput }>(CREATE_COMPANY_MUTATION, {
    input
  });
  return data.createCompany;
}

export async function updateCompany(id: string, input: CompanyUpsertInput) {
  const data = await gqlRequest<UpdateCompanyResponse, { id: string; input: CompanyUpsertInput }>(
    UPDATE_COMPANY_MUTATION,
    { id, input }
  );
  return data.updateCompany;
}

export async function setCompanyAddress(input: SetCompanyAddressInput) {
  const data = await gqlRequest<SetCompanyAddressResponse, { input: SetCompanyAddressInput }>(
    SET_COMPANY_ADDRESS_MUTATION,
    { input }
  );
  return data.setCompanyAddress;
}

export async function deleteCompany(id: string) {
  const data = await gqlRequest<DeleteCompanyResponse, { id: string }>(DELETE_COMPANY_MUTATION, { id });
  return data.deleteCompany;
}

const COMPANY_ERROR_MESSAGES: Record<string, string> = {
  COMPANY_EMAIL_DUPLICATE: "Este e-mail ja esta cadastrado.",
  COMPANY_REGISTRATION_DUPLICATE: "Este CNPJ ja esta cadastrado.",
  COMPANY_NOT_FOUND: "Empresa nao encontrada."
};

export function mapCompanyApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && COMPANY_ERROR_MESSAGES[error.code]) {
      return COMPANY_ERROR_MESSAGES[error.code];
    }

    if (error.code === "VALIDATION_ERROR") {
      return error.message;
    }

    return error.message || "Nao foi possivel salvar os dados da empresa.";
  }

  return "Nao foi possivel salvar os dados da empresa.";
}
