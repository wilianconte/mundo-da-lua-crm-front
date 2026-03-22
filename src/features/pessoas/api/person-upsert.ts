import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const GET_PERSON_BY_ID_QUERY = `
  query GetPersonById($id: UUID!) {
    personById(id: $id) {
      id
      fullName
      preferredName
      documentNumber
      birthDate
      gender
      maritalStatus
      nationality
      occupation
      email
      primaryPhone
      secondaryPhone
      whatsAppNumber
      profileImageUrl
      status
      notes
      createdAt
      updatedAt
    }
  }
`;

const CREATE_PERSON_MUTATION = `
  mutation CreatePerson($input: CreatePersonInput!) {
    createPerson(input: $input) {
      id
      tenantId
      fullName
      preferredName
      documentNumber
      birthDate
      gender
      maritalStatus
      nationality
      occupation
      email
      primaryPhone
      secondaryPhone
      whatsAppNumber
      profileImageUrl
      status
      notes
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PERSON_MUTATION = `
  mutation UpdatePerson($id: UUID!, $input: UpdatePersonInput!) {
    updatePerson(id: $id, input: $input) {
      id
      fullName
      preferredName
      documentNumber
      birthDate
      gender
      maritalStatus
      nationality
      occupation
      email
      primaryPhone
      secondaryPhone
      whatsAppNumber
      profileImageUrl
      status
      notes
      updatedAt
    }
  }
`;

const DELETE_PERSON_MUTATION = `
  mutation DeletePerson($id: UUID!) {
    deletePerson(id: $id)
  }
`;

export type PersonGender = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY" | "OTHER";

export type PersonMaritalStatus =
  | "SINGLE"
  | "MARRIED"
  | "DIVORCED"
  | "WIDOWED"
  | "SEPARATED"
  | "STABLE_UNION";

export type PersonStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type PersonRecord = {
  id: string;
  fullName: string;
  preferredName?: string | null;
  documentNumber?: string | null;
  birthDate?: string | null;
  gender?: PersonGender | null;
  maritalStatus?: PersonMaritalStatus | null;
  nationality?: string | null;
  occupation?: string | null;
  email?: string | null;
  primaryPhone?: string | null;
  secondaryPhone?: string | null;
  whatsAppNumber?: string | null;
  profileImageUrl?: string | null;
  status: PersonStatus;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt: string;
};

export type PersonUpsertInput = {
  fullName: string;
  preferredName?: string;
  documentNumber?: string;
  birthDate?: string;
  gender?: PersonGender;
  maritalStatus?: PersonMaritalStatus;
  nationality?: string;
  occupation?: string;
  email?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  whatsAppNumber?: string;
  profileImageUrl?: string;
  notes?: string;
};

type GetPersonByIdResponse = {
  personById: PersonRecord | null;
};

type CreatePersonResponse = {
  createPerson: PersonRecord;
};

type UpdatePersonResponse = {
  updatePerson: PersonRecord;
};

type DeletePersonResponse = {
  deletePerson: boolean;
};

export async function getPersonById(id: string) {
  const data = await gqlRequest<GetPersonByIdResponse, { id: string }>(GET_PERSON_BY_ID_QUERY, { id });
  return data.personById;
}

export async function createPerson(input: PersonUpsertInput) {
  const data = await gqlRequest<CreatePersonResponse, { input: PersonUpsertInput }>(
    CREATE_PERSON_MUTATION,
    { input }
  );
  return data.createPerson;
}

export async function updatePerson(id: string, input: PersonUpsertInput) {
  const data = await gqlRequest<UpdatePersonResponse, { id: string; input: PersonUpsertInput }>(
    UPDATE_PERSON_MUTATION,
    { id, input }
  );
  return data.updatePerson;
}

export async function deletePerson(id: string) {
  const data = await gqlRequest<DeletePersonResponse, { id: string }>(DELETE_PERSON_MUTATION, { id });
  return data.deletePerson;
}

const PERSON_ERROR_MESSAGES: Record<string, string> = {
  PERSON_EMAIL_DUPLICATE: "Este e-mail ja esta cadastrado.",
  PERSON_DOCUMENT_DUPLICATE: "Este CPF/documento ja esta cadastrado.",
  PERSON_NOT_FOUND: "Pessoa nao encontrada."
};

export function mapPersonApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && PERSON_ERROR_MESSAGES[error.code]) {
      return PERSON_ERROR_MESSAGES[error.code];
    }

    if (error.code === "VALIDATION_ERROR") {
      return error.message;
    }

    return error.message || "Nao foi possivel salvar os dados da pessoa.";
  }

  return "Nao foi possivel salvar os dados da pessoa.";
}
