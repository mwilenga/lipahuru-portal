"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ban, CheckCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SettlementExportMenu } from "@/components/settlements/SettlementExportMenu";
import { DateInput } from "@/components/ui/DateInput";
import { DateTimeCell } from "@/components/ui/DateTimeCell";
import { FilterCard, FilterField } from "@/components/ui/FilterCard";
import { PageLoader } from "@/components/ui/PageLoader";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { RejectReasonPanel } from "@/components/ui/RejectReasonPanel";
import {
  RowActionsMenu,
  rowActionItemClass,
} from "@/components/ui/RowActionsMenu";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Badge, Card, Input } from "@/components/ui/primitives";
import { apiFetch, apiRequest, ApiError } from "@/lib/api";
import { captureApproveIntent, clearApproveIntent } from "@/lib/auth";
import { confirmApprove } from "@/lib/confirm";
import { formatMoney, statusColor } from "@/lib/format";
import { SETTLEMENT_STATUS_OPTIONS } from "@/lib/select-options";
import { toast } from "@/lib/toast";
import type { Merchant, Pagination, SettlementRequest } from "@/types/api";

const PER_PAGE = 10;

function bankLine(settlement: SettlementRequest): string {
  return [settlement.bankName, settlement.bankAccountNumber, settlement.bankAccountName]
    .filter(Boolean)
    .join(" · ");
}

export default function AdminSettlementsPage() {
  const approveHandled = useRef(false);
  const [settlements, setSettlements] = useState<SettlementRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING_APPROVAL");
  const [merchantId, setMerchantId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SettlementRequest | null>(null);
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

  const buildParams = useCallback(
    (pageNum: number, perPage: number) => {
      const params = new URLSearchParams({
        page: String(pageNum),
        perPage: String(perPage),
      });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (merchantId) params.set("merchantId", merchantId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return params;
    },
    [search, status, merchantId, from, to],
  );

  const loadSettlements = useCallback(
    (pageNum: number) => {
      setLoading(true);
      return apiFetch<{ settlements: SettlementRequest[]; pagination: Pagination }>(
        `/admin/v1/settlement-requests?${buildParams(pageNum, PER_PAGE).toString()}`,
      )
        .then((data) => {
          setSettlements(data.settlements);
          setPagination(data.pagination);
        })
        .finally(() => setLoading(false));
    },
    [buildParams],
  );

  useEffect(() => {
    apiFetch<{ merchants: Merchant[] }>("/admin/v1/merchants?perPage=100").then(
      (data) => setMerchants(data.merchants),
    );
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, status, merchantId, from, to]);

  useEffect(() => {
    void loadSettlements(page);
  }, [loadSettlements, page]);

  async function approveSettlement(settlement: SettlementRequest) {
    const confirmed = await confirmApprove({
      title: "Approve settlement?",
      text: `Pay ${formatMoney(settlement.amount, settlement.currency)} to ${settlement.merchantName ?? "merchant"} (${bankLine(settlement) || "no bank details"}). ${formatMoney(settlement.totalDebit, settlement.currency)} including charges will be debited from the ${settlement.wallet?.providerCode ?? "collection"} wallet.`,
      confirmButtonText: "Yes, approve",
    });
    if (!confirmed) return;

    setActionError(null);
    try {
      const { message } = await apiRequest(
        `/admin/v1/settlement-requests/${settlement.id}/approve`,
        { method: "POST" },
      );
      toast.success(message);
      await loadSettlements(page);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Approve failed";
      setActionError(message);
      toast.error(message);
    }
  }

  useEffect(() => {
    if (approveHandled.current) return;

    const raw = captureApproveIntent("settlement");
    if (!raw) return;

    const approveId = Number(raw);
    if (!Number.isFinite(approveId) || approveId <= 0) {
      clearApproveIntent("settlement");
      return;
    }

    approveHandled.current = true;
    setStatus("PENDING_APPROVAL");
    setHighlightId(approveId);

    if (window.location.search.includes("approve=")) {
      window.history.replaceState({}, "", "/admin/settlements");
    }

    void (async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          perPage: "100",
          status: "PENDING_APPROVAL",
        });
        const data = await apiFetch<{ settlements: SettlementRequest[] }>(
          `/admin/v1/settlement-requests?${params.toString()}`,
        );
        const settlement = data.settlements.find((item) => item.id === approveId);
        clearApproveIntent("settlement");
        if (!settlement) {
          setActionError("This settlement is not pending anymore, or was not found.");
          setLoading(false);
          return;
        }
        setSettlements(data.settlements.slice(0, PER_PAGE));
        setLoading(false);
        await approveSettlement(settlement);
      } catch (err) {
        clearApproveIntent("settlement");
        setActionError(err instanceof ApiError ? err.message : "Could not open approval");
        setLoading(false);
      }
    })();
  }, []);

  async function submitReject(reason: string) {
    if (!rejectTarget) return;

    setRejectSubmitting(true);
    setRejectError(null);
    setActionError(null);
    try {
      const { message } = await apiRequest(
        `/admin/v1/settlement-requests/${rejectTarget.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason: reason || undefined }),
        },
      );
      toast.success(message);
      setRejectTarget(null);
      await loadSettlements(page);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Reject failed";
      setRejectError(message);
      setActionError(message);
    } finally {
      setRejectSubmitting(false);
    }
  }

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title="Settlements"
        subtitle="Approve merchant payouts from collection wallets to their bank accounts"
      >
        <div className="space-y-4">
          <FilterCard>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <FilterField label="Search">
                <Input
                  placeholder="Reference / memo"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </FilterField>
              <FilterField label="Merchant">
                <StaticSearchableSelect
                  value={merchantId}
                  onChange={setMerchantId}
                  options={merchantOptions}
                  placeholder="All merchants"
                />
              </FilterField>
              <FilterField label="Status">
                <StaticSearchableSelect
                  value={status}
                  onChange={setStatus}
                  options={SETTLEMENT_STATUS_OPTIONS}
                  placeholder="All statuses"
                />
              </FilterField>
              <FilterField label="From">
                <DateInput value={from} onChange={setFrom} />
              </FilterField>
              <FilterField label="To">
                <DateInput value={to} onChange={setTo} />
              </FilterField>
            </div>
          </FilterCard>

          {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-white">Settlement requests</h2>
              <SettlementExportMenu
                title="Settlement requests"
                filename="settlement-requests"
                showMerchant
                loadRows={async () => {
                  const data = await apiFetch<{ settlements: SettlementRequest[] }>(
                    `/admin/v1/settlement-requests?${buildParams(1, 500).toString()}`,
                  );
                  return data.settlements;
                }}
              />
            </div>

            {loading ? (
              <PageLoader label="Loading settlement requests…" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Reference</th>
                        <th className="px-3 py-2">Merchant</th>
                        <th className="px-3 py-2">Wallet</th>
                        <th className="px-3 py-2">Payout</th>
                        <th className="px-3 py-2">Charges</th>
                        <th className="px-3 py-2">Bank account</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Initiated</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlements.map((settlement) => (
                        <tr
                          key={settlement.id}
                          className={`border-t border-[var(--card-border)] ${
                            highlightId === settlement.id
                              ? "bg-teal-500/10 ring-1 ring-inset ring-teal-500/40"
                              : ""
                          }`}
                        >
                          <td className="px-3 py-3">
                            <div className="font-mono text-xs text-slate-200">
                              {settlement.requestId}
                            </div>
                            {settlement.memo ? (
                              <div className="mt-1 max-w-[14rem] truncate text-xs text-slate-500">
                                {settlement.memo}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-3 py-3 text-slate-200">
                            {settlement.merchantName ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {settlement.wallet?.providerCode ?? settlement.wallet?.name ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-white">
                            {formatMoney(settlement.amount, settlement.currency)}
                          </td>
                          <td className="px-3 py-3 text-slate-400">
                            {formatMoney(settlement.commissionAmount, settlement.currency)}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-300">
                            <div>{settlement.bankName ?? "—"}</div>
                            <div className="font-mono">{settlement.bankAccountNumber}</div>
                            {settlement.bankAccountName ? (
                              <div className="text-slate-500">{settlement.bankAccountName}</div>
                            ) : null}
                          </td>
                          <td className="px-3 py-3">
                            <Badge className={statusColor(settlement.status)}>
                              {settlement.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-slate-400">
                            <DateTimeCell value={settlement.createdAt} />
                          </td>
                          <td className="px-3 py-3">
                            {settlement.status === "PENDING_APPROVAL" ? (
                              <RowActionsMenu>
                                <button
                                  type="button"
                                  className={`${rowActionItemClass} text-emerald-300`}
                                  onClick={() => void approveSettlement(settlement)}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className={`${rowActionItemClass} text-red-300`}
                                  onClick={() => {
                                    setRejectError(null);
                                    setRejectTarget(settlement);
                                  }}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <Ban className="h-4 w-4" />
                                    Reject
                                  </span>
                                </button>
                              </RowActionsMenu>
                            ) : (
                              <span className="text-xs text-slate-500">
                                {settlement.reviewedBy ? `By ${settlement.reviewedBy}` : "—"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {settlements.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                            No settlement requests found.
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

        <RejectReasonPanel
          open={rejectTarget !== null}
          title="Reject settlement"
          description={
            rejectTarget
              ? `Reject ${rejectTarget.requestId} for ${rejectTarget.merchantName ?? "merchant"}. The held funds return to their wallet.`
              : undefined
          }
          submitLabel="Reject settlement"
          submitting={rejectSubmitting}
          error={rejectError}
          onClose={() => {
            if (rejectSubmitting) return;
            setRejectTarget(null);
            setRejectError(null);
          }}
          onSubmit={submitReject}
        />
      </AppShell>
    </AuthGuard>
  );
}
