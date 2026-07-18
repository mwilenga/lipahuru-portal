"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { FilterCard, FilterField } from "@/components/ui/FilterCard";
import { DateInput } from "@/components/ui/DateInput";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Card, Input } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import {
  OPERATION_FILTER_OPTIONS,
  PROVIDER_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/lib/select-options";
import type { Pagination, Transaction, TransactionSummary } from "@/types/api";

const PER_PAGE = 10;

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [providerCode, setProviderCode] = useState("");
  const [status, setStatus] = useState("");
  const [operation, setOperation] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    setPage(1);
  }, [reference, receipt, msisdn, providerCode, status, operation, from, to]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (reference) params.set("reference", reference);
    if (receipt) params.set("providerReceiptNo", receipt);
    if (msisdn) params.set("msisdn", msisdn);
    if (providerCode) params.set("providerCode", providerCode);
    if (status) params.set("status", status);
    if (operation) params.set("operation", operation);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(page));
    params.set("perPage", String(PER_PAGE));

    apiFetch<{
      transactions: Transaction[];
      pagination: Pagination;
      summary: TransactionSummary;
    }>(`/admin/v1/transactions?${params.toString()}`)
      .then((data) => {
        setTransactions(data.transactions);
        setSummary(data.summary);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, [reference, receipt, msisdn, providerCode, status, operation, from, to, page]);

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title="Transactions"
        subtitle="All merchant collections and disbursements"
      >
        <div className="space-y-4">
          <FilterCard>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Reference">
                <Input
                  placeholder="ref / requestId"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </FilterField>
              <FilterField label="Receipt">
                <Input
                  placeholder="MNO receipt no."
                  value={receipt}
                  onChange={(e) => setReceipt(e.target.value)}
                />
              </FilterField>
              <FilterField label="MSISDN">
                <Input
                  placeholder="2557..."
                  value={msisdn}
                  onChange={(e) => setMsisdn(e.target.value)}
                />
              </FilterField>
              <FilterField label="Provider">
                <StaticSearchableSelect
                  value={providerCode}
                  onChange={setProviderCode}
                  options={PROVIDER_FILTER_OPTIONS}
                  placeholder="All providers"
                />
              </FilterField>
              <div className="col-span-full grid gap-3 md:grid-cols-2">
                <FilterField label="Status">
                  <StaticSearchableSelect
                    value={status}
                    onChange={setStatus}
                    options={STATUS_FILTER_OPTIONS}
                    placeholder="All statuses"
                  />
                </FilterField>
                <FilterField label="Operation">
                  <StaticSearchableSelect
                    value={operation}
                    onChange={setOperation}
                    options={OPERATION_FILTER_OPTIONS}
                    placeholder="All operations"
                  />
                </FilterField>
              </div>
              <div className="col-span-full grid gap-3 md:grid-cols-2">
                <FilterField label="From">
                  <DateInput value={from} onChange={setFrom} />
                </FilterField>
                <FilterField label="To">
                  <DateInput value={to} onChange={setTo} />
                </FilterField>
              </div>
            </div>
          </FilterCard>

          <Card>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Total amount (filtered)
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {summary
                ? formatMoney(summary.totalAmount, summary.currency)
                : "—"}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              {summary ? `${summary.count} transaction(s)` : "Loading..."}
            </div>
          </Card>

          {loading ? (
            <div className="text-slate-400">Loading transactions...</div>
          ) : (
            <div>
              <TransactionTable transactions={transactions} showMerchant />
              <PaginationBar pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
