"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Badge, Card } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Wallet } from "@/types/api";

export default function MerchantWalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    apiFetch<Wallet[]>("/v1/portal/wallets").then(setWallets);
  }, []);

  const balance =
    wallets.find((w) => w.walletType === "MERCHANT_BALANCE") ?? wallets[0];

  return (
    <AuthGuard role="merchant">
      <AppShell
        role="merchant"
        title="My balance"
        subtitle="Single wallet for collections and disbursements across all channels"
      >
        {balance ? (
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">{balance.name}</div>
              <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                ACTIVE
              </Badge>
            </div>
            <div className="mt-3 text-xs uppercase tracking-wide text-slate-500">
              Total balance
            </div>
            <div className="mt-1 text-4xl font-semibold text-white">
              {formatMoney(balance.total, balance.currency)}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Available {formatMoney(balance.available, balance.currency)} · Reserved{" "}
              {formatMoney(balance.reserved, balance.currency)}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Providers are payment channels only. Collections credit this balance;
              disbursements reserve and debit from the same pool.
            </p>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">No balance wallet found.</p>
          </Card>
        )}
      </AppShell>
    </AuthGuard>
  );
}
