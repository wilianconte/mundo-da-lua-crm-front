import { gqlRequest } from "@/lib/graphql/client";
import type { TransactionType } from "./get-transactions";

const GET_WALLETS_WITH_BALANCE_QUERY = `
  query GetWalletsWithBalance {
    walletsWithBalance {
      id
      name
      balance
      initialBalance
      isActive
      createdAt
    }
  }
`;

const GET_MONTHLY_SUMMARY_QUERY = `
  query GetTransactionsFiltered($startDate: DateTime, $endDate: DateTime) {
    transactionsFiltered(startDate: $startDate, endDate: $endDate) {
      id
      amount
      type
    }
  }
`;

export type WalletWithBalance = {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
  isActive: boolean;
  createdAt: string;
};

export type MonthlySummary = {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
};

type MonthlyTransaction = {
  id: string;
  amount: number;
  type: TransactionType;
};

type GetWalletsWithBalanceResponse = {
  walletsWithBalance: WalletWithBalance[];
};

type GetMonthlySummaryResponse = {
  transactionsFiltered: MonthlyTransaction[];
};

export async function getWalletsWithBalance(): Promise<WalletWithBalance[]> {
  const data = await gqlRequest<GetWalletsWithBalanceResponse>(GET_WALLETS_WITH_BALANCE_QUERY);
  return data.walletsWithBalance;
}

export async function getMonthlySummary(): Promise<MonthlySummary> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const data = await gqlRequest<GetMonthlySummaryResponse, { startDate: string; endDate: string }>(
    GET_MONTHLY_SUMMARY_QUERY,
    {
      startDate: startOfMonth.toISOString(),
      endDate: now.toISOString()
    }
  );

  const totalIncome = data.transactionsFiltered
    .filter((item) => item.type === "INCOME")
    .reduce((acc, item) => acc + Number(item.amount ?? 0), 0);

  const totalExpense = data.transactionsFiltered
    .filter((item) => item.type === "EXPENSE")
    .reduce((acc, item) => acc + Number(item.amount ?? 0), 0);

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense
  };
}
