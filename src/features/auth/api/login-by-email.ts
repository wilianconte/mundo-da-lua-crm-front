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
  };
};

function extractTenantIdFromToken(token: string): string {
  const payload = token.split(".")[1];
  const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
  return decoded["tenant_id"] as string;
}

export async function loginByEmail(input: LoginByEmailInput) {
  const data = await gqlRequest<LoginByEmailMutationResponse, { input: LoginByEmailInput }>(
    LOGIN_BY_EMAIL_MUTATION,
    { input },
    { requiresAuth: false }
  );

  const { token } = data.loginByEmail;
  return {
    ...data.loginByEmail,
    tenantId: extractTenantIdFromToken(token)
  };
}
