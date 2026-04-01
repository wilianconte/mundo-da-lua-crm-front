import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";
import { normalizePermissions } from "@/lib/auth/permissions";

const GET_MY_PERMISSIONS_QUERY = `
  query GetMyPermissions {
    myPermissions
  }
`;

type GetMyPermissionsResponse = {
  myPermissions: string[];
};

type GraphQLErrorItem = {
  message?: string;
  extensions?: {
    code?: string;
  };
};

export async function getMyPermissions() {
  const data = await gqlRequest<GetMyPermissionsResponse>(GET_MY_PERMISSIONS_QUERY);
  return normalizePermissions(data.myPermissions ?? []);
}

export async function getMyPermissionsWithToken(token: string) {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: GET_MY_PERMISSIONS_QUERY
    })
  });

  if (!response.ok) {
    throw new GraphQLRequestError("Nao foi possivel carregar permissoes.", "NETWORK_ERROR");
  }

  const payload = (await response.json()) as {
    data?: GetMyPermissionsResponse;
    errors?: GraphQLErrorItem[];
  };

  if (payload.errors?.length) {
    const firstError = payload.errors[0];
    throw new GraphQLRequestError(
      firstError?.message || "Nao foi possivel carregar permissoes.",
      firstError?.extensions?.code
    );
  }

  return normalizePermissions(payload.data?.myPermissions ?? []);
}
