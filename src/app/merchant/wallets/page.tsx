"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Badge, Card } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { formatMoney, providerColor } from "@/lib/format";
import type { Wallet } from "@/types/api";

export default function MerchantWalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    apiFetch<Wallet[]>("/v1/portal/wallets").then(setWallets);
  }, []);

  const parent = wallets.find((w) => w.walletType === "MERCHANT_PARENT");
  const providerTotals = wallets.filter((w) => w.walletType === "PROVIDER_TOTAL");
  const leaves = wallets.filter((w) =>
    ["COLLECTION_LEAF", "DISBURSEMENT_LEAF"].includes(w.walletType),
  );

  return (
    <AuthGuard role="merchant">
      <AppShell
        role="merchant"
        title="My wallets"
        subtitle="Live balances across all providers and child wallets"
      >
        {parent ? (
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">Parent wallet</div>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                ACTIVE
              </Badge>
            </div>
            <div className="mt-3 text-xs uppercase tracking-wide text-slate-500">
              Total balance
            </div>
            <div className="mt-1 text-4xl font-semibold text-white">
              {formatMoney(parent.total, parent.currency)}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Available {formatMoney(parent.available, parent.currency)} · Reserved{" "}
              {formatMoney(parent.reserved, parent.currency)}
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
      </AppShell>
    </AuthGuard>
  );
}
