"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Input, Select } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import type { Pagination, Transaction } from "@/types/api";

function MerchantTransactionsView({
  title,
  subtitle,
  operation,
}: {
  title: string;
  subtitle: string;
  operation?: string;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [providerCode, setProviderCode] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (operation) params.set("operation", operation);
    if (status) params.set("status", status);
    if (providerCode) params.set("providerCode", providerCode);
    params.set("perPage", "50");

    apiFetch<{ transactions: Transaction[]; pagination: Pagination }>(
      `/v1/portal/transactions?${params.toString()}`,
    )
      .then((data) => setTransactions(data.transactions))
      .finally(() => setLoading(false));
  }, [operation, status, providerCode]);

  return (
    <AppShell role="merchant" title={title} subtitle={subtitle}>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="PENDING_FINAL">PENDING_FINAL</option>
        </Select>
        <Select value={providerCode} onChange={(e) => setProviderCode(e.target.value)}>
          <option value="">All providers</option>
          <option value="YAS">YAS</option>
          <option value="VODACOM">VODACOM</option>
          <option value="HALOTEL">HALOTEL</option>
          <option value="AIRTEL">AIRTEL</option>
        </Select>
      </div>
      {loading ? (
        <div className="text-slate-400">Loading transactions...</div>
      ) : (
        <TransactionTable transactions={transactions} />
      )}
    </AppShell>
  );
}

export default function MerchantTransactionsPage() {
  return (
    <AuthGuard role="merchant">
      <MerchantTransactionsView
        title="Transactions"
        subtitle="All your collections and disbursements"
      />
    </AuthGuard>
  );
}

export function CollectionsPage() {
  return (
    <AuthGuard role="merchant">
      <MerchantTransactionsView
        title="Collections"
        subtitle="Incoming C2B collections"
        operation="C2B_USSD_PUSH"
      />
    </AuthGuard>
  );
}

export function DisbursementsPage() {
  return (
    <AuthGuard role="merchant">
      <MerchantTransactionsView
        title="Disbursements"
        subtitle="Outgoing B2C disbursements"
        operation="B2C_DISBURSEMENT"
      />
    </AuthGuard>
  );
}
