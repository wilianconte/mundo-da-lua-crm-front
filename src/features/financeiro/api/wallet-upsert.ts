import { GraphQLRequestError, gqlRequest } from "@/lib/graphql/client";

const GET_WALLET_BY_ID_QUERY = `
  query GetWalletById($id: UUID!) {
    wallets(where: { id: { eq: $id }, isDeleted: { eq: false } }, first: 1) {
      nodes {
        id
        name
        initialBalance
        isActive
        createdAt
        updatedAt
      }
    }
    walletsWithBalance {
      id
      balance
    }
  }
`;

const CREATE_WALLET_MUTATION = `
  mutation CreateWallet($input: CreateWalletInput!) {
    createWallet(input: $input) {
      wallet {
        id
        name
        balance
        initialBalance
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

const UPDATE_WALLET_MUTATION = `
  mutation UpdateWallet($id: UUID!, $input: UpdateWalletInput!) {
    updateWallet(id: $id, input: $input) {
      wallet {
        id
        name
        balance
        initialBalance
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_WALLET_MUTATION = `
  mutation DeleteWallet($id: UUID!) {
    deleteWallet(id: $id)
  }
`;

export type WalletRecord = {
  id: string;
  name: string;
  initialBalance: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

type GetWalletByIdResponse = {
  wallets: {
    nodes: Array<{
      id: string;
      name: string;
      initialBalance: number;
      isActive: boolean;
      createdAt: string;
      updatedAt?: string | null;
    }>;
  };
  walletsWithBalance: Array<{ id: string; balance: number }>;
};

type WalletPayloadResponse = {
  wallet: WalletRecord;
};

type CreateWalletResponse = {
  createWallet: WalletPayloadResponse;
};

type UpdateWalletResponse = {
  updateWallet: WalletPayloadResponse;
};

type DeleteWalletResponse = {
  deleteWallet: boolean;
};

export async function getWalletById(id: string): Promise<WalletRecord> {
  const data = await gqlRequest<GetWalletByIdResponse, { id: string }>(GET_WALLET_BY_ID_QUERY, { id });
  const wallet = data.wallets.nodes[0];

  if (!wallet) {
    throw new GraphQLRequestError("Carteira nao encontrada.", "WALLET_NOT_FOUND");
  }

  const walletBalance = data.walletsWithBalance.find((item) => item.id === wallet.id)?.balance ?? wallet.initialBalance;

  return {
    ...wallet,
    balance: walletBalance
  };
}

export async function createWallet(input: {
  name: string;
  initialBalance: number;
}): Promise<WalletRecord> {
  const data = await gqlRequest<CreateWalletResponse, { input: { name: string; initialBalance: number } }>(
    CREATE_WALLET_MUTATION,
    { input }
  );

  return data.createWallet.wallet;
}

export async function updateWallet(
  id: string,
  input: { name: string; initialBalance: number }
): Promise<WalletRecord> {
  const data = await gqlRequest<UpdateWalletResponse, { id: string; input: { name: string; initialBalance: number } }>(
    UPDATE_WALLET_MUTATION,
    { id, input }
  );

  return data.updateWallet.wallet;
}

export async function deleteWallet(id: string): Promise<boolean> {
  const data = await gqlRequest<DeleteWalletResponse, { id: string }>(DELETE_WALLET_MUTATION, { id });
  return data.deleteWallet;
}

const WALLET_ERROR_MESSAGES: Record<string, string> = {
  WALLET_NAME_DUPLICATE: "Ja existe uma carteira com esse nome.",
  WALLET_NOT_FOUND: "Carteira nao encontrada."
};

export function mapWalletApiError(error: unknown): string {
  if (error instanceof GraphQLRequestError) {
    if (error.code && WALLET_ERROR_MESSAGES[error.code]) {
      return WALLET_ERROR_MESSAGES[error.code];
    }

    return error.message || "Nao foi possivel salvar os dados da carteira.";
  }

  return "Nao foi possivel salvar os dados da carteira.";
}
