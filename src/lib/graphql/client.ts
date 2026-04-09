import * as Sentry from "@sentry/nextjs";
import {
  clearAuthSession,
  getAuthUser,
  getAuthRefreshToken,
  getAuthTenantId,
  getValidToken,
  isRefreshTokenExpired,
  saveAuthSession
} from "@/lib/auth/session";

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "";

type GraphQLError = {
  message: string;
  extensions?: {
    code?: string;
  };
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLError[];
};

type GqlRequestOptions = {
  requiresAuth?: boolean;
};

type RefreshTokenMutationResponse = {
  refreshToken: {
    token: string;
    expiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    userId: string;
    name: string;
    email: string;
  };
};

export class GraphQLRequestError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "GraphQLRequestError";
  }
}

function getOperationName(query: string): string | undefined {
  const match = query.match(/\b(query|mutation)\s+([A-Za-z0-9_]+)/);
  return match?.[2];
}

function isUnauthorizedError(error: GraphQLError): boolean {
  const code = error.extensions?.code;
  const message = error.message?.toLowerCase() ?? "";

  return (
    code === "AUTH_NOT_AUTHORIZED" ||
    code === "AUTH_NOT_AUTHENTICATED" ||
    message.includes("unauthorized") ||
    message.includes("unauthenticated")
  );
}

function isNotAuthenticatedError(error: GraphQLError): boolean {
  return error.extensions?.code === "AUTH_NOT_AUTHENTICATED";
}

function isNotAuthorizedError(error: GraphQLError): boolean {
  return error.extensions?.code === "AUTH_NOT_AUTHORIZED";
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  window.location.href = "/login";
}

const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
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

let refreshInFlight: Promise<string | null> | null = null;

async function executeGraphQLRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
  headers?: Record<string, string>
) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {})
    },
    body: JSON.stringify({ query, variables: variables ?? {} })
  });

  const json = (await response.json()) as GraphQLResponse<TData>;
  return { response, json };
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getAuthRefreshToken();
    const tenantId = getAuthTenantId();
    if (!refreshToken || !tenantId || isRefreshTokenExpired()) {
      return null;
    }

    try {
      const { json } = await executeGraphQLRequest<RefreshTokenMutationResponse>(
        REFRESH_TOKEN_MUTATION,
        {
          input: {
            tenantId,
            refreshToken
          }
        }
      );

      if (json.errors?.length || !json.data?.refreshToken) {
        return null;
      }

      const refreshed = json.data.refreshToken;
      await saveAuthSession({
        token: refreshed.token,
        expiresAt: refreshed.expiresAt,
        refreshToken: refreshed.refreshToken,
        refreshTokenExpiresAt: refreshed.refreshTokenExpiresAt,
        tenantId,
        user: {
          userId: refreshed.userId,
          name: refreshed.name,
          email: refreshed.email,
          permissions: getAuthUser()?.permissions ?? []
        }
      });

      return refreshed.token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function getAccessTokenOrRefresh() {
  const currentToken = getValidToken();
  if (currentToken) {
    return currentToken;
  }

  return refreshAccessToken();
}

export async function gqlRequest<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  options: GqlRequestOptions = {}
): Promise<TData> {
  const { requiresAuth = true } = options;
  const headers: Record<string, string> = {};
  let usedToken: string | null = null;
  let refreshedTokenFromUnauthorized: string | null | undefined;

  if (requiresAuth) {
    const token = await getAccessTokenOrRefresh();
    if (!token) {
      await clearAuthSession();
      redirectToLogin();
      throw new GraphQLRequestError("Sessao expirada. Entre novamente.", "AUTH_NOT_AUTHENTICATED");
    }

    usedToken = token;
    headers.Authorization = `Bearer ${token}`;
  }

  let { response, json } = await executeGraphQLRequest<TData>(query, variables, headers);

  if (json.errors?.length) {
    const unauthorized = json.errors.some(isUnauthorizedError);
    if (unauthorized) {
      const notAuthenticated = json.errors.some(isNotAuthenticatedError);
      if (requiresAuth && notAuthenticated) {
        refreshedTokenFromUnauthorized = await refreshAccessToken();
        if (refreshedTokenFromUnauthorized && refreshedTokenFromUnauthorized !== usedToken) {
          ({ response, json } = await executeGraphQLRequest<TData>(query, variables, {
            Authorization: `Bearer ${refreshedTokenFromUnauthorized}`
          }));
        }
      }
    }
  }

  if (json.errors?.length) {
    const notAuthenticated = json.errors.some(isNotAuthenticatedError);
    if (notAuthenticated) {
      if (requiresAuth) {
        await clearAuthSession();
        redirectToLogin();
        throw new GraphQLRequestError("Sessao expirada. Entre novamente.", "AUTH_NOT_AUTHENTICATED");
      }
      throw new GraphQLRequestError("Sessao expirada. Entre novamente.", "AUTH_NOT_AUTHENTICATED");
    }

    const notAuthorized = json.errors.some(isNotAuthorizedError);
    if (notAuthorized) {
      throw new GraphQLRequestError("Voce nao tem permissao para acessar este recurso.", "AUTH_NOT_AUTHORIZED");
    }

    const firstError = json.errors[0];
    Sentry.captureException(new Error(firstError.message), {
      tags: {
        area: "graphql",
        operation: getOperationName(query) ?? "unknown",
        code: firstError.extensions?.code ?? "unknown"
      },
      extra: {
        status: response.status
      }
    });
    throw new GraphQLRequestError(firstError.message, firstError.extensions?.code);
  }

  if (!response.ok || !json.data) {
    Sentry.captureException(new Error("GraphQL response without data"), {
      tags: {
        area: "graphql",
        operation: getOperationName(query) ?? "unknown"
      },
      extra: {
        status: response.status
      }
    });
    throw new GraphQLRequestError("Nao foi possivel concluir a requisicao.");
  }

  return json.data;
}
