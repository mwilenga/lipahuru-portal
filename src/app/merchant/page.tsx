"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Badge, Card } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatMoney as fmt, providerColor } from "@/lib/format";
import type { MerchantDashboard } from "@/types/api";

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
        </div>
        <div className={`rounded-xl p-3 ${accent}`}>{icon}</div>
      </div>
    </Card>
  );
}

export default function MerchantDashboardPage() {
  const user = getUser();
  const [dashboard, setDashboard] = useState<MerchantDashboard | null>(null);

  useEffect(() => {
    apiFetch<MerchantDashboard>("/v1/portal/dashboard").then(setDashboard);
  }, []);

  return (
    <AuthGuard role="merchant">
      <AppShell
        role="merchant"
        title={`Welcome, ${user?.name ?? "Merchant"}`}
        subtitle="Overview of your wallets, collections and disbursements"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Parent wallet"
            value={
              dashboard?.parentWallet
                ? fmt(dashboard.parentWallet.total, dashboard.currency)
                : "—"
            }
            icon={<Wallet className="h-5 w-5 text-teal-300" />}
            accent="bg-teal-500/10"
          />
          <StatCard
            title="Collections today"
            value={fmt(dashboard?.collectionsToday ?? "0", dashboard?.currency ?? "TZS")}
            icon={<ArrowDownLeft className="h-5 w-5 text-emerald-300" />}
            accent="bg-emerald-500/10"
          />
          <StatCard
            title="Disbursements today"
            value={fmt(dashboard?.disbursementsToday ?? "0", dashboard?.currency ?? "TZS")}
            icon={<ArrowUpRight className="h-5 w-5 text-blue-300" />}
            accent="bg-blue-500/10"
          />
          <StatCard
            title="Pending"
            value={`${dashboard?.pendingCount ?? 0}`}
            icon={<Clock3 className="h-5 w-5 text-amber-300" />}
            accent="bg-amber-500/10"
          />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <Card>
            <h3 className="text-lg font-medium text-white">Provider balances</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(dashboard?.providerWallets ?? []).map((wallet) => (
                <div
                  key={wallet.providerCode}
                  className="rounded-xl border border-[var(--card-border)] bg-slate-950 p-4"
                >
                  <Badge className={providerColor(wallet.providerCode)}>
                    {wallet.providerCode}
                  </Badge>
                  <div className="mt-3 text-xl font-semibold text-white">
                    {fmt(wallet.total, wallet.currency)}
                  </div>
                </div>
              ))}
              {(dashboard?.providerWallets?.length ?? 0) === 0 ? (
                <p className="text-sm text-slate-500">No provider wallets yet.</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Recent transactions</h3>
              <Link href="/merchant/transactions" className="text-sm text-teal-300">
                View all
              </Link>
            </div>
            <TransactionTable transactions={dashboard?.recentTransactions ?? []} />
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
