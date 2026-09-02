"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DateTimeCell } from "@/components/ui/DateTimeCell";
import { FilterCard, FilterField } from "@/components/ui/FilterCard";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Button, Card, Input } from "@/components/ui/primitives";
import { apiFetch, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Merchant, Pagination } from "@/types/api";

const PER_PAGE = 10;

type BalanceCredit = {
  id: number;
  creditId: string;
  merchantId: number;
  merchantName?: string;
  amount: string;
  currency: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
};

export default function AdminBalanceCreditsPage() {
  const [credits, setCredits] = useState<BalanceCredit[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantId, setMerchantId] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [formMerchantId, setFormMerchantId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const formMerchantOptions = useMemo(
    () =>
      merchants.map((merchant) => ({
        value: String(merchant.id),
        label: merchant.name,
        description: merchant.email,
      })),
    [merchants],
  );

  const loadCredits = useCallback(
    (pageNum: number) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageNum),
        perPage: String(PER_PAGE),
      });
      if (merchantId) params.set("merchantId", merchantId);

      return apiFetch<{ credits: BalanceCredit[]; pagination: Pagination }>(
        `/admin/v1/balance-credits?${params.toString()}`,
      )
        .then((data) => {
          setCredits(data.credits);
          setPagination(data.pagination);
        })
        .finally(() => setLoading(false));
    },
    [merchantId],
  );

  useEffect(() => {
    apiFetch<{ merchants: Merchant[] }>("/admin/v1/merchants?perPage=100").then(
      (data) => setMerchants(data.merchants),
    );
  }, []);

  useEffect(() => {
    setPage(1);
  }, [merchantId]);

  useEffect(() => {
    void loadCredits(page);
  }, [loadCredits, page]);

  async function submitCredit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formMerchantId) {
      setError("Select a merchant.");
      return;
    }

    if (amount.trim() === "" || Number(amount) < 100) {
      setError("Enter an amount of at least 100.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<BalanceCredit>("/admin/v1/balance-credits", {
        method: "POST",
        body: JSON.stringify({
          merchantId: Number(formMerchantId),
          amount: amount.trim(),
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      setPanelOpen(false);
      setFormMerchantId("");
      setAmount("");
      setReference("");
      setNotes("");
      setPage(1);
      await loadCredits(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Credit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title="Balance Credits"
        subtitle="Credit a merchant's single balance wallet"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <FilterCard className="flex-1">
            <FilterField label="Merchant">
              <StaticSearchableSelect
                value={merchantId}
                onChange={setMerchantId}
                options={merchantOptions}
                placeholder="Merchant"
              />
            </FilterField>
          </FilterCard>
          <Button type="button" onClick={() => setPanelOpen(true)}>
            Credit balance
          </Button>
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Credit history</h2>
            {loading ? <span className="text-xs text-slate-500">Loading…</span> : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Credit</th>
                  <th className="px-3 py-2">Merchant</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">By</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((credit) => (
                  <tr key={credit.id} className="border-t border-[var(--card-border)]">
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs text-slate-200">{credit.creditId}</div>
                      {credit.reference ? (
                        <div className="mt-1 text-xs text-slate-500">{credit.reference}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-slate-200">{credit.merchantName ?? "—"}</td>
                    <td className="px-3 py-3 text-white">
                      {formatMoney(credit.amount, credit.currency)}
                    </td>
                    <td className="px-3 py-3 text-slate-400">{credit.createdBy ?? "—"}</td>
                    <td className="px-3 py-3 text-slate-400">
                      <DateTimeCell value={credit.createdAt} />
                    </td>
                  </tr>
                ))}
                {!loading && credits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      No balance credits yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <PaginationBar pagination={pagination} onPageChange={setPage} />
        </Card>

        <SlidePanel
          open={panelOpen}
          title="Credit merchant balance"
          onClose={() => setPanelOpen(false)}
        >
          <form onSubmit={submitCredit} className="space-y-4">
            <FilterField label="Merchant">
              <StaticSearchableSelect
                value={formMerchantId}
                onChange={setFormMerchantId}
                options={formMerchantOptions}
                placeholder="Select merchant"
              />
            </FilterField>
            <FilterField label="Amount">
              <Input
                type="number"
                min="100"
                step="0.01"
                placeholder="Amount (min 100)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </FilterField>
            <FilterField label="Reference">
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional reference"
              />
            </FilterField>
            <FilterField label="Notes">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </FilterField>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <p className="text-xs text-slate-500">
              Credits the merchant&apos;s single balance immediately. Providers remain
              channels only.
            </p>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Crediting…" : "Credit now"}
            </Button>
          </form>
        </SlidePanel>
      </AppShell>
    </AuthGuard>
  );
}
