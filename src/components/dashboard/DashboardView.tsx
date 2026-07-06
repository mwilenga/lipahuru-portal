"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  Store,
  Wallet,
} from "lucide-react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Badge, Card } from "@/components/ui/primitives";
import { formatMoney as fmt, providerColor } from "@/lib/format";
import type { PortalDashboard } from "@/types/api";

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

export function DashboardView({
  dashboard,
  balanceTitle,
  transactionsHref,
  showMerchant = false,
}: {
  dashboard: PortalDashboard | null;
  balanceTitle: string;
  transactionsHref: string;
  showMerchant?: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={balanceTitle}
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
          title={showMerchant ? "Merchants" : "Pending"}
          value={
            showMerchant
              ? `${dashboard?.activeMerchantCount ?? 0} / ${dashboard?.merchantCount ?? 0}`
              : `${dashboard?.pendingCount ?? 0}`
          }
          icon={
            showMerchant ? (
              <Store className="h-5 w-5 text-violet-300" />
            ) : (
              <Clock3 className="h-5 w-5 text-amber-300" />
            )
          }
          accent={showMerchant ? "bg-violet-500/10" : "bg-amber-500/10"}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="text-lg font-medium text-white">Provider balances</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(dashboard?.providerWallets ?? []).map((wallet) => (
              <div
                key={`${wallet.providerCode ?? wallet.name}`}
                className="rounded-xl border border-[var(--card-border)] bg-slate-950 p-4"
              >
                <Badge className={providerColor(wallet.providerCode)}>
                  {wallet.providerCode ?? wallet.name}
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
            <Link href={transactionsHref} className="text-sm text-teal-300">
              View all
            </Link>
          </div>
          <TransactionTable
            transactions={dashboard?.recentTransactions ?? []}
            showMerchant={showMerchant}
          />
        </Card>
      </div>
    </>
  );
}
