import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
      isActive
      personId
      createdAt
      updatedAt
      createdBy
      updatedBy
    }
  }
`;

export type UserUpsertRecord = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  personId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UserUpsertInput = {
  name: string;
  email: string;
  password: string;
  personId?: string;
};

type CreateUserResponse = {
  createUser: UserUpsertRecord;
};

export async function createUser(input: UserUpsertInput) {
  const data = await gqlRequest<CreateUserResponse, { input: UserUpsertInput }>(CREATE_USER_MUTATION, { input });
  return data.createUser;
}

const USER_ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: "Usuario nao encontrado.",
  USER_EMAIL_DUPLICATE: "Este e-mail ja esta cadastrado.",
  USER_PERSON_ALREADY_LINKED: "A pessoa selecionada ja esta vinculada a outro usuario."
};

export function mapUserApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && USER_ERROR_MESSAGES[error.code]) {
      return USER_ERROR_MESSAGES[error.code];
    }

    if (error.code === "VALIDATION_ERROR") {
      return error.message;
    }

    return error.message || "Nao foi possivel salvar os dados do usuario.";
  }

  return "Nao foi possivel salvar os dados do usuario.";
}
