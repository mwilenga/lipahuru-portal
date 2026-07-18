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
import { defaultWeekDateRange, formatMoney } from "@/lib/format";
import {
  PROVIDER_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/lib/select-options";
import type { Pagination, Transaction, TransactionSummary } from "@/types/api";

const PER_PAGE = 10;
const defaultDates = defaultWeekDateRange();

export function MerchantTransactionsView({
  title,
  subtitle,
  operation,
}: {
  title: string;
  subtitle: string;
  operation?: string;
}) {
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
  const [from, setFrom] = useState(defaultDates.from);
  const [to, setTo] = useState(defaultDates.to);

  useEffect(() => {
    setPage(1);
  }, [operation, reference, receipt, msisdn, status, providerCode, from, to]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (operation) params.set("operation", operation);
    if (reference) params.set("reference", reference);
    if (receipt) params.set("providerReceiptNo", receipt);
    if (msisdn) params.set("msisdn", msisdn);
    if (status) params.set("status", status);
    if (providerCode) params.set("providerCode", providerCode);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(page));
    params.set("perPage", String(PER_PAGE));

    apiFetch<{
      transactions: Transaction[];
      pagination: Pagination;
      summary: TransactionSummary;
    }>(`/v1/portal/transactions?${params.toString()}`)
      .then((data) => {
        setTransactions(data.transactions);
        setSummary(data.summary);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, [operation, reference, receipt, msisdn, status, providerCode, from, to, page]);

  return (
    <AppShell role="merchant" title={title} subtitle={subtitle}>
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
              <FilterField label="From">
                <DateInput value={from} onChange={setFrom} />
              </FilterField>
              <FilterField label="To">
                <DateInput value={to} onChange={setTo} />
              </FilterField>
            </div>
            <FilterField label="Status">
              <StaticSearchableSelect
                value={status}
                onChange={setStatus}
                options={STATUS_FILTER_OPTIONS}
                placeholder="All statuses"
              />
            </FilterField>
          </div>
        </FilterCard>

        <Card>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Total amount (filtered)
          </div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {summary ? formatMoney(summary.totalAmount, summary.currency) : "—"}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            {summary ? `${summary.count} transaction(s)` : "Loading..."}
          </div>
        </Card>

        {loading ? (
          <div className="text-slate-400">Loading transactions...</div>
        ) : (
          <div>
            <TransactionTable transactions={transactions} />
            <PaginationBar pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>
    </AppShell>
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
