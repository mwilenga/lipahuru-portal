"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { FilterCard, FilterField } from "@/components/ui/FilterCard";
import { PageLoader } from "@/components/ui/PageLoader";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { Card, Input } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import {
  exportMerchantFundsExcel,
  exportMerchantFundsPdf,
} from "@/lib/merchant-funds-export";
import { PROVIDER_FILTER_OPTIONS } from "@/lib/select-options";
import type { MerchantFundsRow, MerchantFundsTotals } from "@/types/api";

type MerchantFundsResponse = {
  merchants: MerchantFundsRow[];
  totals: MerchantFundsTotals;
};

export default function AdminMerchantFundsPage() {
  const [data, setData] = useState<MerchantFundsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [providerCode, setProviderCode] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (providerCode) params.set("providerCode", providerCode);

    let cancelled = false;
    apiFetch<MerchantFundsResponse>(`/admin/v1/reports/merchant-funds?${params.toString()}`)
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load merchant funds");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, providerCode]);

  const totals = data?.totals ?? null;
  const rows = data?.merchants ?? [];
  const money = (amount: string | undefined, currency?: string) =>
    amount !== undefined ? formatMoney(amount, currency ?? totals?.currency ?? "TZS") : "—";

  function exportRows(kind: "excel" | "pdf") {
    if (!totals || rows.length === 0) {
      throw new Error("No merchants to export for the current filters.");
    }
    const payload = {
      rows,
      totals,
      subtitle: providerCode ? `Provider: ${providerCode}` : "All providers",
    };
    if (kind === "excel") {
      exportMerchantFundsExcel(payload);
    } else {
      exportMerchantFundsPdf(payload);
    }
  }

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title="Merchant Funds"
        subtitle="Collections, charges and settlements per merchant"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total collected"
              value={money(totals?.collected)}
              hint={totals ? `${totals.collectionCount} successful collection(s)` : "—"}
            />
            <SummaryCard
              label="Charges"
              value={money(totals?.charges)}
              hint="Collection commission"
              valueClassName="text-amber-300"
            />
            <SummaryCard
              label="Settled"
              value={money(totals?.settled)}
              hint={
                totals
                  ? `${money(totals.pendingSettlement)} pending approval`
                  : "—"
              }
              valueClassName="text-sky-300"
            />
            <SummaryCard
              label="Net remaining"
              value={money(totals?.netRemaining)}
              hint="Collected − charges − settled"
              valueClassName="text-teal-300"
            />
          </div>

          <FilterCard>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <FilterField label="Search">
                <Input
                  placeholder="Merchant name / email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
            </div>
          </FilterCard>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-white">Merchants</h2>
                <p className="text-xs text-slate-500">
                  All-time successful collections. Net remaining = collected − charges − settled
                  payouts.
                </p>
              </div>
              <ExportMenu onExport={exportRows} disabled={loading || rows.length === 0} />
            </div>

            {loading ? (
              <PageLoader label="Loading merchant funds…" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Merchant</th>
                      <th className="px-3 py-2 text-right">Collections</th>
                      <th className="px-3 py-2 text-right">Collected</th>
                      <th className="px-3 py-2 text-right">Charges</th>
                      <th className="px-3 py-2 text-right">Settled</th>
                      <th className="px-3 py-2 text-right">Pending settlement</th>
                      <th className="px-3 py-2 text-right">Net remaining</th>
                      <th className="px-3 py-2 text-right">Wallet balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.merchantId} className="border-t border-[var(--card-border)]">
                        <td className="px-3 py-3">
                          <div className="text-slate-200">{row.merchantName}</div>
                          <div className="text-xs text-slate-500">{row.merchantEmail}</div>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300">
                          {row.collectionCount}
                        </td>
                        <td className="px-3 py-3 text-right text-white">
                          {money(row.collected, row.currency)}
                        </td>
                        <td className="px-3 py-3 text-right text-amber-300">
                          {money(row.charges, row.currency)}
                        </td>
                        <td className="px-3 py-3 text-right text-sky-300">
                          {money(row.settled, row.currency)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-400">
                          {money(row.pendingSettlement, row.currency)}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-teal-300">
                          {money(row.netRemaining, row.currency)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300">
                          {money(row.walletBalance, row.currency)}
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                          No merchants found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                  {totals && rows.length > 0 ? (
                    <tfoot>
                      <tr className="border-t-2 border-[var(--card-border)] font-semibold">
                        <td className="px-3 py-3 text-slate-200">Total</td>
                        <td className="px-3 py-3 text-right text-slate-300">
                          {totals.collectionCount}
                        </td>
                        <td className="px-3 py-3 text-right text-white">{money(totals.collected)}</td>
                        <td className="px-3 py-3 text-right text-amber-300">
                          {money(totals.charges)}
                        </td>
                        <td className="px-3 py-3 text-right text-sky-300">{money(totals.settled)}</td>
                        <td className="px-3 py-3 text-right text-slate-400">
                          {money(totals.pendingSettlement)}
                        </td>
                        <td className="px-3 py-3 text-right text-teal-300">
                          {money(totals.netRemaining)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300">
                          {money(totals.walletBalance)}
                        </td>
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
