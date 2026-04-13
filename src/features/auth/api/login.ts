import { gqlRequest } from "@/lib/graphql/client";

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      expiresAt
      refreshToken
      refreshTokenExpiresAt
      userId
      name
      email
      isAdmin
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
    refreshToken: string;
    refreshTokenExpiresAt: string;
    userId: string;
    name: string;
    email: string;
    isAdmin: boolean;
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
