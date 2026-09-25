"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ban, CheckCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DateTimeCell } from "@/components/ui/DateTimeCell";
import { FilterCard, FilterField } from "@/components/ui/FilterCard";
import { PageLoader } from "@/components/ui/PageLoader";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { RejectReasonPanel } from "@/components/ui/RejectReasonPanel";
import {
  RowActionsMenu,
  rowActionItemClass,
} from "@/components/ui/RowActionsMenu";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { apiFetch, ApiError } from "@/lib/api";
import { confirmApprove } from "@/lib/confirm";
import { formatMoney, providerColor, statusColor } from "@/lib/format";
import { FLOAT_TOPUP_STATUS_OPTIONS } from "@/lib/select-options";
import type { FloatTopup, Merchant, Pagination } from "@/types/api";

const PER_PAGE = 10;
const NETWORKS = ["VODACOM", "AIRTEL", "YAS", "HALOTEL"] as const;

function AdminFloatTopupsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const approveHandled = useRef(false);
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
  const [rejectTarget, setRejectTarget] = useState<FloatTopup | null>(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);

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
    const confirmed = await confirmApprove({
      title: "Approve float topup?",
      text: `Credit ${formatMoney(topup.totalAmount, topup.currency)} to ${topup.merchantName ?? "merchant"} (${topup.topupId}).`,
      confirmButtonText: "Yes, approve",
    });
    if (!confirmed) return;

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

  useEffect(() => {
    const raw = searchParams.get("approve");
    if (!raw || approveHandled.current) return;

    const approveId = Number(raw);
    if (!Number.isFinite(approveId) || approveId <= 0) return;

    approveHandled.current = true;
    setStatus("PENDING");
    setHighlightId(approveId);
    router.replace("/admin/float-topups");

    void (async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          perPage: "100",
          status: "PENDING",
        });
        const data = await apiFetch<{ topups: FloatTopup[] }>(
          `/admin/v1/float-topups?${params.toString()}`,
        );
        const topup = data.topups.find((item) => item.id === approveId);
        if (!topup) {
          setActionError(
            "This float topup is not pending anymore, or was not found.",
          );
          return;
        }
        setTopups(data.topups.slice(0, PER_PAGE));
        await approveTopup(topup);
      } catch (err) {
        setActionError(
          err instanceof ApiError ? err.message : "Could not open approval",
        );
      }
    })();
  }, [searchParams, router]);

  function openRejectTopup(topup: FloatTopup) {
    setRejectError(null);
    setRejectTarget(topup);
  }

  async function submitRejectTopup(reason: string) {
    if (!rejectTarget) return;

    setRejectSubmitting(true);
    setRejectError(null);
    setActionError(null);
    try {
      await apiFetch(`/admin/v1/float-topups/${rejectTarget.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || undefined }),
      });
      setRejectTarget(null);
      await loadTopups(page);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Reject failed";
      setRejectError(message);
      setActionError(message);
    } finally {
      setRejectSubmitting(false);
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
        <div className="space-y-4">
          <FilterCard>
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

          {actionError ? (
            <p className="text-sm text-rose-300">{actionError}</p>
          ) : null}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-white">Topup requests</h2>
              </div>
              <Button type="button" onClick={() => setDirectOpen(true)}>
                Direct topup
              </Button>
            </div>

            {loading ? (
              <PageLoader label="Loading topup requests…" />
            ) : (
              <>
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
                  <tr
                    key={topup.id}
                    className={`border-t border-[var(--card-border)] ${
                      highlightId === topup.id
                        ? "bg-teal-500/10 ring-1 ring-inset ring-teal-500/40"
                        : ""
                    }`}
                  >
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
                        <RowActionsMenu>
                          <button
                            type="button"
                            className={`${rowActionItemClass} text-emerald-300`}
                            onClick={() => void approveTopup(topup)}
                          >
                            <span className="inline-flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </span>
                          </button>
                          <button
                            type="button"
                            className={`${rowActionItemClass} text-red-300`}
                            onClick={() => openRejectTopup(topup)}
                          >
                            <span className="inline-flex items-center gap-2">
                              <Ban className="h-4 w-4" />
                              Reject
                            </span>
                          </button>
                        </RowActionsMenu>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {topup.reviewedBy ? `By ${topup.reviewedBy}` : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {topups.length === 0 ? (
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
              </>
            )}
        </Card>
        </div>

        <SlidePanel
          open={directOpen}
          title="Direct float topup"
          size="half"
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

        <RejectReasonPanel
          open={rejectTarget !== null}
          title="Reject float topup"
          description={
            rejectTarget
              ? `Reject ${rejectTarget.topupId} for ${rejectTarget.merchantName ?? "merchant"}.`
              : undefined
          }
          submitLabel="Reject topup"
          submitting={rejectSubmitting}
          error={rejectError}
          onClose={() => {
            if (rejectSubmitting) return;
            setRejectTarget(null);
            setRejectError(null);
          }}
          onSubmit={submitRejectTopup}
        />
      </AppShell>
    </AuthGuard>
  );
}

export default function AdminFloatTopupsPage() {
  return (
    <Suspense
      fallback={
        <AuthGuard role="admin">
          <AppShell
            role="admin"
            title="Float Topups"
            subtitle="Approve merchant float requests or credit disbursement wallets directly"
          >
            <PageLoader label="Loading topup requests…" />
          </AppShell>
        </AuthGuard>
      }
    >
      <AdminFloatTopupsContent />
    </Suspense>
  );
}
