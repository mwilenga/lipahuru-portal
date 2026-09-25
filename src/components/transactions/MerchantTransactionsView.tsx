"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { FilterField } from "@/components/ui/FilterCard";
import { DateInput } from "@/components/ui/DateInput";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { PageLoader } from "@/components/ui/PageLoader";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Button, Card, Input } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { fetchAllFilteredTransactions } from "@/lib/fetch-all-transactions";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [providerCode, setProviderCode] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState(defaultDates.from);
  const [to, setTo] = useState(defaultDates.to);

  const activeFilterCount = useMemo(() => {
    let count = [reference, receipt, msisdn, providerCode, status].filter(
      Boolean,
    ).length;
    if (from !== defaultDates.from) count += 1;
    if (to !== defaultDates.to) count += 1;
    return count;
  }, [reference, receipt, msisdn, providerCode, status, from, to]);

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

  function clearFilters() {
    setReference("");
    setReceipt("");
    setMsisdn("");
    setProviderCode("");
    setStatus("");
    setFrom(defaultDates.from);
    setTo(defaultDates.to);
  }

  return (
    <AppShell role="merchant" title={title} subtitle={subtitle}>
      <div className="space-y-4">
        <Card className="w-full !p-4 md:w-1/3 md:max-w-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Total amount (filtered)
          </div>
          <div className="mt-1.5 text-2xl font-semibold text-white">
            {summary ? formatMoney(summary.totalAmount, summary.currency) : "—"}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            {summary ? `${summary.count} transaction(s)` : "—"}
          </div>
        </Card>

        {loading ? (
          <PageLoader label="Loading transactions…" />
        ) : (
          <div>
            <TransactionTable
              transactions={transactions}
              title="Transactions"
              exportFilename={
                operation === "B2C_DISBURSEMENT"
                  ? "disbursements"
                  : operation === "C2B_USSD_PUSH"
                    ? "collections"
                    : "transactions"
              }
              toolbarActions={
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setFiltersOpen(true)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 ? (
                    <span className="rounded-full bg-teal-500/20 px-1.5 py-0.5 text-xs text-teal-200">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </Button>
              }
              loadExportRows={async () => {
                const params = new URLSearchParams();
                if (operation) params.set("operation", operation);
                if (reference) params.set("reference", reference);
                if (receipt) params.set("providerReceiptNo", receipt);
                if (msisdn) params.set("msisdn", msisdn);
                if (status) params.set("status", status);
                if (providerCode) params.set("providerCode", providerCode);
                if (from) params.set("from", from);
                if (to) params.set("to", to);
                return fetchAllFilteredTransactions("/v1/portal/transactions", params);
              }}
            />
            <PaginationBar pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>

      <SlidePanel
        open={filtersOpen}
        title="Filters"
        size="half"
        onClose={() => setFiltersOpen(false)}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <FilterField label="From">
              <DateInput value={from} onChange={setFrom} />
            </FilterField>
            <FilterField label="To">
              <DateInput value={to} onChange={setTo} />
            </FilterField>
            <FilterField label="Status">
              <StaticSearchableSelect
                value={status}
                onChange={setStatus}
                options={STATUS_FILTER_OPTIONS}
                placeholder="All statuses"
              />
            </FilterField>
          </div>
          <div className="flex gap-2 border-t border-[var(--card-border)] pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={clearFilters}
            >
              Clear
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => setFiltersOpen(false)}
            >
              Apply
            </Button>
          </div>
        </div>
      </SlidePanel>
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
