import { gqlRequest } from "@/lib/graphql/client";

const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
  newPasswordConfirmation: string;
};

type ResetPasswordMutationResponse = {
  resetPassword: boolean;
};

export async function resetPassword(input: ResetPasswordInput) {
  const data = await gqlRequest<ResetPasswordMutationResponse, { input: ResetPasswordInput }>(
    RESET_PASSWORD_MUTATION,
    { input },
    { requiresAuth: false }
  );

  return data.resetPassword;
}
