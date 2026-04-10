import { gqlRequest } from "@/lib/graphql/client";

const LOGIN_BY_EMAIL_MUTATION = `
  mutation LoginByEmail($input: LoginByEmailInput!) {
    loginByEmail(input: $input) {
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
    userId: string;
    name: string;
    email: string;
    isAdmin: boolean;
  };
};

function parseTokenPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
}

export async function loginByEmail(input: LoginByEmailInput) {
  const data = await gqlRequest<LoginByEmailMutationResponse, { input: LoginByEmailInput }>(
    LOGIN_BY_EMAIL_MUTATION,
    { input },
    { requiresAuth: false }
  );

  const { token } = data.loginByEmail;
  const tokenPayload = parseTokenPayload(token);

  return {
    ...data.loginByEmail,
    isAdmin:
      typeof data.loginByEmail.isAdmin === "boolean"
        ? data.loginByEmail.isAdmin
        : tokenPayload["is_admin"] === "true",
    tenantId: tokenPayload["tenant_id"] as string
  };
}
