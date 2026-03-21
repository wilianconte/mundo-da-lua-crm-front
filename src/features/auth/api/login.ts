import { gqlRequest } from "@/lib/graphql/client";

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      expiresAt
      userId
      name
      email
    }
  }
`;

export type LoginInput = {
  tenantId: string;
  email: string;
  password: string;
};

type LoginMutationResponse = {
  login: {
    token: string;
    expiresAt: string;
    userId: string;
    name: string;
    email: string;
  };
};

export async function login(input: LoginInput) {
  const data = await gqlRequest<LoginMutationResponse, { input: LoginInput }>(
    LOGIN_MUTATION,
    { input },
    { requiresAuth: false }
  );

  return data.login;
}
