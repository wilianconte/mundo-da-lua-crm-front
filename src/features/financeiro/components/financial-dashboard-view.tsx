"use client";

import { ArrowRightLeft, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { StatCard } from "@/components/data-display/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureViewHeader } from "@/features/components/registration-view-header";
import { getMonthlySummary, type MonthlySummary } from "../api/dashboard";
import { getWalletsWithBalance, type WalletWithBalance } from "../api/get-wallets";

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

export function FinancialDashboardView() {
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [summary, setSummary] = useState<MonthlySummary>({ totalIncome: 0, totalExpense: 0, netBalance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [walletsData, summaryData] = await Promise.all([getWalletsWithBalance(), getMonthlySummary()]);
        if (!active) return;

        setWallets(walletsData);
        setSummary(summaryData);
      } catch {
        if (!active) return;
        setWallets([]);
        setSummary({ totalIncome: 0, totalExpense: 0, netBalance: 0 });
        setErrorMessage("Nao foi possivel carregar o dashboard financeiro.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const activeWallets = useMemo(() => wallets.filter((item) => item.isActive), [wallets]);
  const totalBalance = useMemo(
    () => activeWallets.reduce((acc, item) => acc + Number(item.balance ?? 0), 0),
    [activeWallets]
  );

  return (
    <div className="space-y-6">
      <FeatureViewHeader
        backAriaLabel="Voltar para dashboard"
        backHref="/"
        description="Visao geral do financeiro"
        title="Financeiro"
      />

      {errorMessage ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-danger-strong)]">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail={`Soma de ${activeWallets.length} carteira(s) ativa(s)`}
          icon={Wallet}
          title="Saldo Total"
          value={isLoading ? "..." : toCurrency(totalBalance)}
        />
        <StatCard
          detail="Mes atual"
          icon={TrendingUp}
          title="Entradas do Mes"
          value={isLoading ? "..." : toCurrency(summary.totalIncome)}
        />
        <StatCard
          detail="Mes atual"
          icon={TrendingDown}
          title="Saidas do Mes"
          value={isLoading ? "..." : toCurrency(summary.totalExpense)}
        />
        <StatCard
          detail="Resultado do mes"
          icon={ArrowRightLeft}
          title="Saldo do Mes"
          value={isLoading ? "..." : toCurrency(summary.netBalance)}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Carteiras</CardTitle>
              <p className="text-xs text-[var(--color-muted-foreground)]">Inclui carteiras inativas</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/financeiro/carteiras/pesquisa">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-sm">
                <thead className="text-left text-[var(--color-muted-foreground)]">
                  <tr>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Saldo</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!wallets.length && !isLoading ? (
                    <tr className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-4 text-[var(--color-muted-foreground)]" colSpan={3}>
                        Nenhuma carteira encontrada.
                      </td>
                    </tr>
                  ) : null}
                  {wallets.map((wallet) => (
                    <tr className="border-t border-[var(--color-border)]" key={wallet.id}>
                      <td className="px-3 py-3">{wallet.name}</td>
                      <td className={`px-3 py-3 font-semibold ${wallet.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {toCurrency(wallet.balance)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={wallet.isActive ? "success" : "attention"}>{wallet.isActive ? "Ativa" : "Inativa"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atalhos rapidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/financeiro/transacoes/cadastro">Nova Transacao</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/financeiro/transferencias/cadastro">Nova Transferencia</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/financeiro/conciliacao">Conciliacao</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
