"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageLoader } from "@/components/ui/PageLoader";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { formatMoney, providerColor } from "@/lib/format";
import type { Wallet } from "@/types/api";

type WalletsResponse = {
  wallets: Wallet[];
  actualBalance: string;
  transactionFee: string;
  totalPayout: string;
  totalPayoutCharges: string;
  currency: string;
};

export default function MerchantWalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [actualBalance, setActualBalance] = useState<string>("0");
  const [transactionFee, setTransactionFee] = useState<string>("0");
  const [totalPayout, setTotalPayout] = useState<string>("0");
  const [totalPayoutCharges, setTotalPayoutCharges] = useState<string>("0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<WalletsResponse>("/v1/portal/wallets")
      .then((data) => {
        setWallets(data.wallets ?? []);
        setActualBalance(data.actualBalance ?? "0");
        setTransactionFee(data.transactionFee ?? "0");
        setTotalPayout(data.totalPayout ?? "0");
        setTotalPayoutCharges(data.totalPayoutCharges ?? "0");
      })
      .finally(() => setLoading(false));
  }, []);

  const parent = wallets.find((w) => w.walletType === "MERCHANT_PARENT");
  const providerTotals = wallets.filter((w) => w.walletType === "PROVIDER_TOTAL");
  const leaves = wallets.filter((w) =>
    ["COLLECTION_LEAF", "DISBURSEMENT_LEAF"].includes(w.walletType),
  );
  const currency = parent?.currency ?? "TZS";

  return (
    <AuthGuard role="merchant">
      <AppShell
        role="merchant"
        title="My wallets"
        subtitle="Live balances across all providers and child wallets"
      >
        <div className="mb-4 flex justify-end">
          <Link href="/merchant/float-topups">
            <Button type="button">Request float topup</Button>
          </Link>
        </div>

        {loading ? (
          <PageLoader label="Loading wallets…" />
        ) : (
          <>
            {parent ? (
              <Card className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">Parent wallet</div>
                  <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                    ACTIVE
                  </Badge>
                </div>

                <div className="mt-4 grid gap-6 lg:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Available balance
                    </div>
                    <div className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                      {formatMoney(parent.total, currency)}
                    </div>
                    <div className="mt-2 text-sm text-slate-400">
                      Reserved {formatMoney(parent.reserved, currency)}
                    </div>
                  </div>

                  <div className="lg:border-l lg:border-[var(--card-border)] lg:pl-6">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Actual balance
                    </div>
                    <div className="mt-1 text-xl font-semibold text-teal-300 sm:text-2xl">
                      {formatMoney(actualBalance, currency)}
                    </div>
                    <div className="mt-2 text-sm text-amber-200">
                      Transaction fee {formatMoney(transactionFee, currency)}
                    </div>
                  </div>

                  <div className="lg:border-l lg:border-[var(--card-border)] lg:pl-6">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Total payout
                    </div>
                    <div className="mt-1 text-xl font-semibold text-rose-300/80 sm:text-2xl">
                      {formatMoney(totalPayout, currency)}
                    </div>
                    <div className="mt-2 text-xs text-rose-300/60">
                      Total payout charges {formatMoney(totalPayoutCharges, currency)}
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {providerTotals.map((wallet) => {
                const collection = leaves.find(
                  (leaf) =>
                    leaf.providerCode === wallet.providerCode &&
                    leaf.walletType === "COLLECTION_LEAF",
                );
                const disbursement = leaves.find(
                  (leaf) =>
                    leaf.providerCode === wallet.providerCode &&
                    leaf.walletType === "DISBURSEMENT_LEAF",
                );

                return (
                  <Card key={wallet.walletId}>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-medium text-white">{wallet.name}</div>
                      <Badge className={providerColor(wallet.providerCode)}>
                        {wallet.providerCode}
                      </Badge>
                    </div>
                    <div className="mt-4 text-2xl font-semibold text-white">
                      {formatMoney(wallet.total, wallet.currency)}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-emerald-500/10 p-3">
                        <div className="text-xs text-emerald-300">Collection</div>
                        <div className="mt-1 font-medium text-white">
                          {formatMoney(collection?.total ?? "0", wallet.currency)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-blue-500/10 p-3">
                        <div className="text-xs text-blue-300">Disbursement</div>
                        <div className="mt-1 font-medium text-white">
                          {formatMoney(disbursement?.total ?? "0", wallet.currency)}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {!parent && providerTotals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-10 text-center text-sm text-slate-500">
                No wallets found.
              </div>
            ) : null}
          </>
        )}
      </AppShell>
    </AuthGuard>
  );
}
