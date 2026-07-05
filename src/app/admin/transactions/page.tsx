"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Input, Select } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import type { Pagination, Transaction } from "@/types/api";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [providerCode, setProviderCode] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (providerCode) params.set("providerCode", providerCode);
    params.set("perPage", "50");

    apiFetch<{ transactions: Transaction[]; pagination: Pagination }>(
      `/admin/v1/transactions?${params.toString()}`,
    )
      .then((data) => setTransactions(data.transactions))
      .finally(() => setLoading(false));
  }, [search, status, providerCode]);

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title="Transactions"
        subtitle="All merchant collections and disbursements"
      >
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Search reference, msisdn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          <TransactionTable transactions={transactions} showMerchant />
        )}
      </AppShell>
    </AuthGuard>
  );
}
