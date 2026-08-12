"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DateTimeCell } from "@/components/ui/DateTimeCell";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { apiFetch, ApiError } from "@/lib/api";
import { formatMoney, providerColor, statusColor } from "@/lib/format";
import type { FloatTopup, Pagination, Wallet } from "@/types/api";

const PER_PAGE = 10;

export default function MerchantFloatTopupsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [topups, setTopups] = useState<FloatTopup[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const networks = useMemo(() => {
    const leaves = wallets.filter((w) => w.walletType === "DISBURSEMENT_LEAF");
    return leaves
      .filter((w) => w.providerCode)
      .map((w) => ({
        providerCode: w.providerCode as string,
        name: w.name,
        available: w.available,
        currency: w.currency,
      }))
      .sort((a, b) => a.providerCode.localeCompare(b.providerCode));
  }, [wallets]);

  const loadTopups = useCallback((pageNum: number) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pageNum),
      perPage: String(PER_PAGE),
    });
    return apiFetch<{ topups: FloatTopup[]; pagination: Pagination }>(
      `/v1/portal/float-topups?${params.toString()}`,
    )
      .then((data) => {
        setTopups(data.topups);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiFetch<Wallet[]>("/v1/portal/wallets").then(setWallets);
  }, []);

  useEffect(() => {
    void loadTopups(page);
  }, [loadTopups, page]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const items = Object.entries(amounts)
      .map(([providerCode, amount]) => ({
        providerCode,
        amount: amount.trim(),
      }))
      .filter((item) => item.amount !== "" && Number(item.amount) > 0);

    if (items.length === 0) {
      setError("Enter at least one network amount (minimum 100).");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<FloatTopup>("/v1/portal/float-topups", {
        method: "POST",
        body: JSON.stringify({
          items,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      setAmounts({});
      setReference("");
      setNotes("");
      setSuccess("Float topup request submitted. Waiting for admin approval.");
      setPage(1);
      await loadTopups(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard role="merchant">
      <AppShell
        role="merchant"
        title="Float Topups"
        subtitle="Request disbursement float per network for admin approval"
      >
        <Card className="mb-6">
          <form onSubmit={submitRequest} className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-white">New request</h2>
              <p className="mt-1 text-sm text-slate-400">
                Enter the amount to top up for each MNO disbursement wallet.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {networks.map((network) => (
                <div
                  key={network.providerCode}
                  className="rounded-xl border border-[var(--card-border)] bg-slate-950/60 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge className={providerColor(network.providerCode)}>
                      {network.providerCode}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Available {formatMoney(network.available, network.currency)}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="100"
                    step="0.01"
                    placeholder="Amount (min 100)"
                    value={amounts[network.providerCode] ?? ""}
                    onChange={(e) =>
                      setAmounts((prev) => ({
                        ...prev,
                        [network.providerCode]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            {networks.length === 0 ? (
              <p className="text-sm text-slate-500">No disbursement wallets found.</p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-500">Reference</span>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Optional bank / transfer ref"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-500">Notes</span>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for admin"
                />
              </label>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

            <Button type="submit" disabled={submitting || networks.length === 0}>
              {submitting ? "Submitting…" : "Submit topup request"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Request history</h2>
            {loading ? <span className="text-xs text-slate-500">Loading…</span> : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Topup ID</th>
                  <th className="px-3 py-2">Networks</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {topups.map((topup) => (
                  <tr key={topup.id} className="border-t border-[var(--card-border)]">
                    <td className="px-3 py-3 font-mono text-xs text-slate-200">
                      {topup.topupId}
                    </td>
                    <td className="px-3 py-3 text-slate-300">
                      {topup.items
                        .map(
                          (item) =>
                            `${item.providerCode ?? "?"} ${formatMoney(item.amount, topup.currency)}`,
                        )
                        .join(" · ")}
                    </td>
                    <td className="px-3 py-3 text-white">
                      {formatMoney(topup.totalAmount, topup.currency)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={statusColor(topup.status)}>{topup.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-400">
                      <DateTimeCell value={topup.createdAt} />
                    </td>
                  </tr>
                ))}
                {!loading && topups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      No float topup requests yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <PaginationBar pagination={pagination} onPageChange={setPage} />
        </Card>

        <div className="mt-4 text-sm text-slate-500">
          Need balances?{" "}
          <Link href="/merchant/wallets" className="text-teal-300 hover:underline">
            View wallets
          </Link>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
