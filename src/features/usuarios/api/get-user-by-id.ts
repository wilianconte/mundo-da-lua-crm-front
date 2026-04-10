import { gqlRequest } from "@/lib/graphql/client";

const GET_USER_BY_ID_QUERY = `
  query GetUserById($id: UUID!) {
    userById(id: $id) {
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
      roles {
        id
        name
        description
        isActive
      }
    }
  }
`;

export type UserByIdNode = {
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
  roles: Array<{
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
  }>;
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
