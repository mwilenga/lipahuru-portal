"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DateTimeCell } from "@/components/ui/DateTimeCell";
import { FilterCard, FilterField } from "@/components/ui/FilterCard";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { apiFetch, ApiError } from "@/lib/api";
import { formatMoney, providerColor, statusColor } from "@/lib/format";
import { FLOAT_TOPUP_STATUS_OPTIONS } from "@/lib/select-options";
import type { FloatTopup, Merchant, Pagination } from "@/types/api";

const PER_PAGE = 10;
const NETWORKS = ["VODACOM", "AIRTEL", "YAS", "HALOTEL"] as const;

export default function AdminFloatTopupsPage() {
  const [topups, setTopups] = useState<FloatTopup[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [merchantId, setMerchantId] = useState("");
  const [directOpen, setDirectOpen] = useState(false);
  const [directMerchantId, setDirectMerchantId] = useState("");
  const [directAmounts, setDirectAmounts] = useState<Record<string, string>>({});
  const [directReference, setDirectReference] = useState("");
  const [directNotes, setDirectNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const directMerchantOptions = useMemo(
    () =>
      merchants.map((merchant) => ({
        value: String(merchant.id),
        label: merchant.name,
        description: merchant.email,
      })),
    [merchants],
  );

  const loadTopups = useCallback(
    (pageNum: number) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageNum),
        perPage: String(PER_PAGE),
      });
      if (status) params.set("status", status);
      if (merchantId) params.set("merchantId", merchantId);

      return apiFetch<{ topups: FloatTopup[]; pagination: Pagination }>(
        `/admin/v1/float-topups?${params.toString()}`,
      )
        .then((data) => {
          setTopups(data.topups);
          setPagination(data.pagination);
        })
        .finally(() => setLoading(false));
    },
    [merchantId, status],
  );

  useEffect(() => {
    apiFetch<{ merchants: Merchant[] }>("/admin/v1/merchants?perPage=100").then(
      (data) => setMerchants(data.merchants),
    );
  }, []);

  useEffect(() => {
    setPage(1);
  }, [status, merchantId]);

  useEffect(() => {
    void loadTopups(page);
  }, [loadTopups, page]);

  async function approveTopup(topup: FloatTopup) {
    setActionError(null);
    try {
      await apiFetch(`/admin/v1/float-topups/${topup.id}/approve`, {
        method: "POST",
      });
      await loadTopups(page);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Approve failed");
    }
  }

  async function rejectTopup(topup: FloatTopup) {
    const reason = window.prompt(`Reject ${topup.topupId}? Optional reason:`);
    if (reason === null) return;

    setActionError(null);
    try {
      await apiFetch(`/admin/v1/float-topups/${topup.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      await loadTopups(page);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Reject failed");
    }
  }

  async function submitDirectTopup(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);

    if (!directMerchantId) {
      setActionError("Select a merchant.");
      return;
    }

    const items = Object.entries(directAmounts)
      .map(([providerCode, amount]) => ({
        providerCode,
        amount: amount.trim(),
      }))
      .filter((item) => item.amount !== "" && Number(item.amount) > 0);

    if (items.length === 0) {
      setActionError("Enter at least one network amount (minimum 100).");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<FloatTopup>("/admin/v1/float-topups", {
        method: "POST",
        body: JSON.stringify({
          merchantId: Number(directMerchantId),
          items,
          reference: directReference.trim() || undefined,
          notes: directNotes.trim() || undefined,
        }),
      });
      setDirectOpen(false);
      setDirectMerchantId("");
      setDirectAmounts({});
      setDirectReference("");
      setDirectNotes("");
      setStatus("");
      setPage(1);
      await loadTopups(1);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Direct topup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title="Float Topups"
        subtitle="Approve merchant float requests or credit disbursement wallets directly"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <FilterCard className="flex-1">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FilterField label="Status">
                <StaticSearchableSelect
                  value={status}
                  onChange={setStatus}
                  options={FLOAT_TOPUP_STATUS_OPTIONS}
                  placeholder="Status"
                />
              </FilterField>
              <FilterField label="Merchant">
                <StaticSearchableSelect
                  value={merchantId}
                  onChange={setMerchantId}
                  options={merchantOptions}
                  placeholder="Merchant"
                />
              </FilterField>
            </div>
          </FilterCard>
          <Button type="button" onClick={() => setDirectOpen(true)}>
            Direct topup
          </Button>
        </div>

        {actionError ? (
          <p className="mb-3 text-sm text-rose-300">{actionError}</p>
        ) : null}

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Topup requests</h2>
            {loading ? <span className="text-xs text-slate-500">Loading…</span> : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Topup</th>
                  <th className="px-3 py-2">Merchant</th>
                  <th className="px-3 py-2">Networks</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topups.map((topup) => (
                  <tr key={topup.id} className="border-t border-[var(--card-border)]">
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs text-slate-200">{topup.topupId}</div>
                      {topup.reference ? (
                        <div className="mt-1 text-xs text-slate-500">{topup.reference}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-slate-200">{topup.merchantName ?? "—"}</td>
                    <td className="px-3 py-3 text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {topup.items.map((item) => (
                          <Badge
                            key={`${topup.id}-${item.providerCode}`}
                            className={providerColor(item.providerCode)}
                          >
                            {item.providerCode} {formatMoney(item.amount, topup.currency)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-white">
                      {formatMoney(topup.totalAmount, topup.currency)}
                    </td>
                    <td className="px-3 py-3 text-slate-400">{topup.source}</td>
                    <td className="px-3 py-3">
                      <Badge className={statusColor(topup.status)}>{topup.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-400">
                      <DateTimeCell value={topup.createdAt} />
                    </td>
                    <td className="px-3 py-3">
                      {topup.status === "PENDING" ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => approveTopup(topup)}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => rejectTopup(topup)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {topup.reviewedBy ? `By ${topup.reviewedBy}` : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && topups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                      No float topups found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <PaginationBar pagination={pagination} onPageChange={setPage} />
        </Card>

        <SlidePanel
          open={directOpen}
          title="Direct float topup"
          onClose={() => setDirectOpen(false)}
        >
          <form onSubmit={submitDirectTopup} className="space-y-4">
            <FilterField label="Merchant">
              <StaticSearchableSelect
                value={directMerchantId}
                onChange={setDirectMerchantId}
                options={directMerchantOptions}
                placeholder="Select merchant"
              />
            </FilterField>

            <div className="grid gap-3">
              {NETWORKS.map((code) => (
                <div
                  key={code}
                  className="rounded-xl border border-[var(--card-border)] bg-slate-950/60 p-3"
                >
                  <div className="mb-2">
                    <Badge className={providerColor(code)}>{code}</Badge>
                  </div>
                  <Input
                    type="number"
                    min="100"
                    step="0.01"
                    placeholder="Amount (min 100)"
                    value={directAmounts[code] ?? ""}
                    onChange={(e) =>
                      setDirectAmounts((prev) => ({
                        ...prev,
                        [code]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <FilterField label="Reference">
              <Input
                value={directReference}
                onChange={(e) => setDirectReference(e.target.value)}
                placeholder="Optional reference"
              />
            </FilterField>
            <FilterField label="Notes">
              <Input
                value={directNotes}
                onChange={(e) => setDirectNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </FilterField>

            <p className="text-xs text-slate-500">
              This credits the merchant disbursement wallets immediately.
            </p>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Crediting…" : "Credit float now"}
            </Button>
          </form>
        </SlidePanel>
      </AppShell>
    </AuthGuard>
  );
}
