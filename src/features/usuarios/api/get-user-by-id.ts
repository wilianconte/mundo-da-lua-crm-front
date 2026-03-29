import { gqlRequest } from "@/lib/graphql/client";

const GET_USER_BY_ID_QUERY = `
  query GetUserById($id: UUID!) {
    userById(id: $id) {
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

export type UserByIdNode = {
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

type GetUserByIdResponse = {
  userById: UserByIdNode | null;
};

type GetUserByIdVariables = {
  id: string;
};

export async function getUserById(id: string) {
  const data = await gqlRequest<GetUserByIdResponse, GetUserByIdVariables>(GET_USER_BY_ID_QUERY, { id });
  return data.userById;
}
