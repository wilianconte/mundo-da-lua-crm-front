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

function parseBooleanClaim(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : null;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
}

export async function loginByEmail(input: LoginByEmailInput) {
  const data = await gqlRequest<LoginByEmailMutationResponse, { input: LoginByEmailInput }>(
    LOGIN_BY_EMAIL_MUTATION,
    { input },
    { requiresAuth: false }
  );

  const { token } = data.loginByEmail;
  const tokenPayload = parseTokenPayload(token);
  const tokenIsAdminClaim = parseBooleanClaim(tokenPayload["is_admin"]);
  const graphqlIsAdmin = data.loginByEmail.isAdmin;

  return {
    ...data.loginByEmail,
    isAdmin: tokenIsAdminClaim ?? graphqlIsAdmin,
    tenantId: tokenPayload["tenant_id"] as string
  };
}
