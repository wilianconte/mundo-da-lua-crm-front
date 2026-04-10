import { gqlRequest } from "@/lib/graphql/client";

const LOGIN_BY_EMAIL_MUTATION = `
  mutation LoginByEmail($input: LoginByEmailInput!) {
    loginByEmail(input: $input) {
      token
      expiresAt
      refreshToken
      refreshTokenExpiresAt
      tenantId
      userId
      name
      email
    }
  }
`;

export type LoginByEmailInput = {
  email: string;
  password: string;
};

type LoginByEmailMutationResponse = {
  loginByEmail: {
    token: string;
    expiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    tenantId: string;
    userId: string;
    name: string;
    email: string;
  };
};

export async function loginByEmail(input: LoginByEmailInput) {
  const data = await gqlRequest<LoginByEmailMutationResponse, { input: LoginByEmailInput }>(
    LOGIN_BY_EMAIL_MUTATION,
    { input },
    { requiresAuth: false }
  );

  return data.loginByEmail;
}
