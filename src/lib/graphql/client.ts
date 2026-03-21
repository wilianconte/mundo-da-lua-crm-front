import { clearAuthSession, getValidToken } from "@/lib/auth/session";

const GRAPHQL_ENDPOINT = "/api/graphql";

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

export class GraphQLRequestError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "GraphQLRequestError";
  }
}

function isUnauthorizedError(error: GraphQLError): boolean {
  const code = error.extensions?.code;
  const message = error.message?.toLowerCase() ?? "";

  return code === "AUTH_NOT_AUTHORIZED" || message.includes("unauthorized");
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  window.location.href = "/login";
}

export async function gqlRequest<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  options: GqlRequestOptions = {}
): Promise<TData> {
  const { requiresAuth = true } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (requiresAuth) {
    const token = getValidToken();
    if (!token) {
      redirectToLogin();
      throw new GraphQLRequestError("Sessao expirada. Entre novamente.", "AUTH_NOT_AUTHORIZED");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables: variables ?? {} })
  });

  const json = (await response.json()) as GraphQLResponse<TData>;

  if (json.errors?.length) {
    const unauthorized = json.errors.some(isUnauthorizedError);
    if (unauthorized) {
      clearAuthSession();
      redirectToLogin();
      throw new GraphQLRequestError("Sessao expirada. Entre novamente.", "AUTH_NOT_AUTHORIZED");
    }

    const firstError = json.errors[0];
    throw new GraphQLRequestError(firstError.message, firstError.extensions?.code);
  }

  if (!response.ok || !json.data) {
    throw new GraphQLRequestError("Nao foi possivel concluir a requisicao.");
  }

  return json.data;
}
