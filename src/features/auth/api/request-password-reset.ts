import { gqlRequest } from "@/lib/graphql/client";

const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input)
  }
`;

export type RequestPasswordResetInput = {
  email: string;
};

type RequestPasswordResetMutationResponse = {
  requestPasswordReset: boolean;
};

export async function requestPasswordReset(input: RequestPasswordResetInput) {
  const data = await gqlRequest<RequestPasswordResetMutationResponse, { input: RequestPasswordResetInput }>(
    REQUEST_PASSWORD_RESET_MUTATION,
    { input },
    { requiresAuth: false }
  );

  return data.requestPasswordReset;
}
