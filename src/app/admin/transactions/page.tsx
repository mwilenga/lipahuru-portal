"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { FilterField } from "@/components/ui/FilterCard";
import { DateInput } from "@/components/ui/DateInput";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Button, Card, Input } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { fetchAllFilteredTransactions } from "@/lib/fetch-all-transactions";
import { defaultWeekDateRange, formatMoney } from "@/lib/format";
import {
  OPERATION_FILTER_OPTIONS,
  PROVIDER_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/lib/select-options";
import type {
  Merchant,
  Pagination,
  Transaction,
  TransactionSummary,
} from "@/types/api";

const PER_PAGE = 10;
const defaultDates = defaultWeekDateRange();

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantId, setMerchantId] = useState("");
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [providerCode, setProviderCode] = useState("");
  const [status, setStatus] = useState("");
  const [operation, setOperation] = useState("");
  const [from, setFrom] = useState(defaultDates.from);
  const [to, setTo] = useState(defaultDates.to);

  const merchantOptions = useMemo(
    () => [
      { value: "", label: "All merchants" },
      ...merchants.map((merchant) => ({
        value: String(merchant.id),
        label: merchant.name,
        description: merchant.email,
      })),
    ],
    [merchants],
  );

  const activeFilterCount = useMemo(() => {
    let count = [
      merchantId,
      reference,
      receipt,
      msisdn,
      providerCode,
      status,
      operation,
    ].filter(Boolean).length;
    if (from !== defaultDates.from) count += 1;
    if (to !== defaultDates.to) count += 1;
    return count;
  }, [
    merchantId,
    reference,
    receipt,
    msisdn,
    providerCode,
    status,
    operation,
    from,
    to,
  ]);

  useEffect(() => {
    apiFetch<{ merchants: Merchant[] }>("/admin/v1/merchants?perPage=100").then(
      (data) => setMerchants(data.merchants),
    );
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    merchantId,
    reference,
    receipt,
    msisdn,
    providerCode,
    status,
    operation,
    from,
    to,
  ]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (merchantId) params.set("merchantId", merchantId);
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
  }, [
    merchantId,
    reference,
    receipt,
    msisdn,
    providerCode,
    status,
    operation,
    from,
    to,
    page,
  ]);

  function clearFilters() {
    setMerchantId("");
    setReference("");
    setReceipt("");
    setMsisdn("");
    setProviderCode("");
    setStatus("");
    setOperation("");
    setFrom(defaultDates.from);
    setTo(defaultDates.to);
  }

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title="Transactions"
        subtitle="All merchant collections and disbursements"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Card className="min-w-0 flex-1 !p-4 sm:!p-5">
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFiltersOpen(true)}
              className="gap-2 self-start"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-teal-500/20 px-1.5 py-0.5 text-xs text-teal-200">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </div>

          {loading ? (
            <div className="text-slate-400">Loading transactions...</div>
          ) : (
            <div>
              <TransactionTable
                transactions={transactions}
                showMerchant
                title="Transactions"
                exportFilename="admin-transactions"
                loadExportRows={async () => {
                  const params = new URLSearchParams();
                  if (merchantId) params.set("merchantId", merchantId);
                  if (reference) params.set("reference", reference);
                  if (receipt) params.set("providerReceiptNo", receipt);
                  if (msisdn) params.set("msisdn", msisdn);
                  if (providerCode) params.set("providerCode", providerCode);
                  if (status) params.set("status", status);
                  if (operation) params.set("operation", operation);
                  if (from) params.set("from", from);
                  if (to) params.set("to", to);
                  return fetchAllFilteredTransactions(
                    "/admin/v1/transactions",
                    params,
                  );
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
              <FilterField label="Merchant">
                <StaticSearchableSelect
                  value={merchantId}
                  onChange={setMerchantId}
                  options={merchantOptions}
                  placeholder="All merchants"
                />
              </FilterField>
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
              <FilterField label="From">
                <DateInput value={from} onChange={setFrom} />
              </FilterField>
              <FilterField label="To">
                <DateInput value={to} onChange={setTo} />
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
                Done
              </Button>
            </div>
          </div>
        </SlidePanel>
      </AppShell>
    </AuthGuard>
  );
}
