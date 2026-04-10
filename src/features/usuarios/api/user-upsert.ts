import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
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
`;

const UPDATE_USER_MUTATION = `
  mutation UpdateUser($id: UUID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
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
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: UUID!) {
    deleteUser(id: $id)
  }
`;

export type UserUpsertRecord = {
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

export type UserUpsertInput = {
  name: string;
  email: string;
  password?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  personId?: string;
  roleIds?: string[];
};

type CreateUserResponse = {
  createUser: UserUpsertRecord;
};

type UpdateUserResponse = {
  updateUser: UserUpsertRecord;
};

type DeleteUserResponse = {
  deleteUser: boolean;
};

type DeleteUserVariables = {
  id: string;
};

type UpdateUserVariables = {
  id: string;
  input: UserUpsertInput;
};

export async function createUser(input: UserUpsertInput) {
  const data = await gqlRequest<CreateUserResponse, { input: UserUpsertInput }>(CREATE_USER_MUTATION, { input });
  return data.createUser;
}

export async function updateUser(id: string, input: UserUpsertInput) {
  const data = await gqlRequest<UpdateUserResponse, UpdateUserVariables>(UPDATE_USER_MUTATION, { id, input });
  return data.updateUser;
}

export async function deleteUser(id: string) {
  const data = await gqlRequest<DeleteUserResponse, DeleteUserVariables>(DELETE_USER_MUTATION, { id });
  return data.deleteUser;
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
