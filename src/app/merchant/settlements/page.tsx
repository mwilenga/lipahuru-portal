"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SettlementExportMenu } from "@/components/settlements/SettlementExportMenu";
import { DateTimeCell } from "@/components/ui/DateTimeCell";
import { FilterField } from "@/components/ui/FilterCard";
import { PageLoader } from "@/components/ui/PageLoader";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { apiFetch, apiRequest, ApiError } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { formatMoney, statusColor } from "@/lib/format";
import { SETTLEMENT_STATUS_OPTIONS } from "@/lib/select-options";
import { toast } from "@/lib/toast";
import type {
  Pagination,
  SettlementRequest,
  SettlementWalletsResponse,
} from "@/types/api";

const PER_PAGE = 10;

function commissionLabel(commission: SettlementWalletsResponse["commission"]): string {
  if (!commission.type || Number(commission.value) <= 0) return "No collection charges";
  return commission.type === "PERCENT"
    ? `${Number(commission.value)}% per collection`
    : `${formatMoney(commission.value, "TZS")} per collection`;
}

export default function MerchantSettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [walletData, setWalletData] = useState<SettlementWalletsResponse | null>(null);
  const [walletsError, setWalletsError] = useState<string | null>(null);
  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const wallets = useMemo(() => walletData?.wallets ?? [], [walletData]);
  const bankAccount = walletData?.bankAccount ?? null;

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => String(wallet.walletId) === walletId),
    [wallets, walletId],
  );

  const walletOptions = useMemo(
    () =>
      wallets.map((wallet) => ({
        value: String(wallet.walletId),
        label: `${wallet.providerCode ?? wallet.name} — ${formatMoney(wallet.settleable, wallet.currency)}`,
        description: `Available ${formatMoney(wallet.available, wallet.currency)}`,
      })),
    [wallets],
  );

  const exceedsSettleable =
    selectedWallet !== undefined &&
    amount.trim() !== "" &&
    Number(amount) > Number(selectedWallet.settleable);

  const buildParams = useCallback(
    (pageNum: number, perPage: number) => {
      const params = new URLSearchParams({
        page: String(pageNum),
        perPage: String(perPage),
      });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      return params;
    },
    [search, status],
  );

  const loadWallets = useCallback(async () => {
    setWalletsError(null);
    try {
      setWalletData(
        await apiFetch<SettlementWalletsResponse>("/v1/portal/settlements/wallets"),
      );
    } catch (err) {
      setWalletsError(err instanceof ApiError ? err.message : "Failed to load wallets");
    }
  }, []);

  const loadSettlements = useCallback(
    (pageNum: number) => {
      setLoading(true);
      return apiFetch<{ settlements: SettlementRequest[]; pagination: Pagination }>(
        `/v1/portal/settlements?${buildParams(pageNum, PER_PAGE).toString()}`,
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
    void loadWallets();
  }, [loadWallets]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    void loadSettlements(page);
  }, [loadSettlements, page]);

  async function submitSettlement(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!walletId) {
      setFormError("Select a source wallet.");
      return;
    }
    if (amount.trim() === "" || Number(amount) < 100) {
      setFormError("Enter an amount of at least 100.");
      return;
    }

    setSubmitting(true);
    try {
      const { message } = await apiRequest<SettlementRequest>("/v1/portal/settlements", {
        method: "POST",
        body: JSON.stringify({
          walletId: Number(walletId),
          amount: amount.trim(),
          memo: memo.trim() || undefined,
        }),
      });
      toast.success(message);
      setWalletId("");
      setAmount("");
      setMemo("");
      setPage(1);
      await Promise.all([loadSettlements(1), loadWallets()]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to submit settlement";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelSettlement(settlement: SettlementRequest) {
    const confirmed = await confirmAction({
      title: "Cancel settlement request?",
      text: `${settlement.requestId} for ${formatMoney(settlement.amount, settlement.currency)}. The held funds return to your wallet.`,
      confirmButtonText: "Yes, cancel it",
    });
    if (!confirmed) return;

    try {
      const { message } = await apiRequest(`/v1/portal/settlements/${settlement.id}/cancel`, {
        method: "POST",
      });
      toast.success(message);
      await Promise.all([loadSettlements(page), loadWallets()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel settlement");
    }
  }

  return (
    <AuthGuard role="merchant">
      <AppShell
        role="merchant"
        title="Settlements"
        subtitle="Request a payout of collection funds to your settlement bank account."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Card className="h-fit p-0">
            <div className="border-b border-[var(--card-border)] px-5 py-4">
              <h2 className="text-base font-medium text-white">Request settlement</h2>
            </div>
            <form onSubmit={submitSettlement} className="space-y-4 p-5">
              {walletsError ? <p className="text-sm text-rose-300">{walletsError}</p> : null}

              <FilterField label="Source wallet">
                <StaticSearchableSelect
                  value={walletId}
                  onChange={setWalletId}
                  options={walletOptions}
                  placeholder="Select wallet"
                  disabled={walletOptions.length === 0}
                />
              </FilterField>

              {selectedWallet ? (
                <dl className="space-y-1.5 rounded-xl border border-[var(--card-border)] bg-slate-950 p-3 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Available balance</dt>
                    <dd className="text-slate-200">
                      {formatMoney(selectedWallet.available, selectedWallet.currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Collection charges due</dt>
                    <dd className="text-amber-300">
                      − {formatMoney(selectedWallet.commissionOutstanding, selectedWallet.currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-[var(--card-border)] pt-1.5">
                    <dt className="font-medium text-slate-300">Settleable</dt>
                    <dd className="font-medium text-teal-300">
                      {formatMoney(selectedWallet.settleable, selectedWallet.currency)}
                    </dd>
                  </div>
                  {walletData ? (
                    <p className="pt-1 text-[11px] text-slate-500">
                      Charges: {commissionLabel(walletData.commission)}
                    </p>
                  ) : null}
                </dl>
              ) : null}

              <FilterField label={`Amount (${selectedWallet?.currency ?? "TZS"})`}>
                <Input
                  type="number"
                  min="100"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </FilterField>
              {exceedsSettleable ? (
                <p className="text-xs text-amber-300">
                  Amount exceeds the settleable balance on this wallet.
                </p>
              ) : null}

              <FilterField label="Memo">
                <textarea
                  rows={3}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full rounded-xl border border-[var(--card-border)] bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none ring-teal-500/30 focus:ring-2"
                />
              </FilterField>

              {bankAccount ? (
                <div className="rounded-xl border border-[var(--card-border)] bg-slate-950 p-3 text-xs text-slate-400">
                  <div className="mb-1 text-slate-500">Paid to</div>
                  <div className="text-slate-200">{bankAccount.bankName}</div>
                  <div className="font-mono text-slate-300">{bankAccount.accountNumber}</div>
                  {bankAccount.accountName ? <div>{bankAccount.accountName}</div> : null}
                  {bankAccount.branch ? <div>{bankAccount.branch} branch</div> : null}
                </div>
              ) : walletData ? (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  No settlement bank account is set on your business profile. Contact
                  LipaHuru support to add one before requesting a settlement.
                </p>
              ) : null}

              <p className="text-xs text-slate-500">
                Paid out to the settlement bank account on your business profile.
                Outstanding collection charges are deducted with the payout. Funds
                are held on the source wallet until the request is approved,
                rejected, or cancelled.
              </p>

              {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={submitting || exceedsSettleable || !bankAccount}
              >
                <CheckCircle2 className="h-4 w-4" />
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </form>
          </Card>

          <Card className="p-0">
            <div className="flex flex-wrap items-end gap-3 border-b border-[var(--card-border)] p-4">
              <div className="min-w-[12rem] flex-1">
                <FilterField label="Search">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      className="pl-9"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </FilterField>
              </div>
              <div className="w-44">
                <FilterField label="Status">
                  <StaticSearchableSelect
                    value={status}
                    onChange={setStatus}
                    options={SETTLEMENT_STATUS_OPTIONS}
                    placeholder="All statuses"
                  />
                </FilterField>
              </div>
              <div className="ml-auto">
                <SettlementExportMenu
                  title="Settlements"
                  filename="settlements"
                  loadRows={async () => {
                    const data = await apiFetch<{ settlements: SettlementRequest[] }>(
                      `/v1/portal/settlements?${buildParams(1, 500).toString()}`,
                    );
                    return data.settlements;
                  }}
                />
              </div>
            </div>

            {loading ? (
              <PageLoader label="Loading settlements…" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Wallet</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Initiated</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {settlements.map((settlement) => (
                        <tr key={settlement.id} className="border-t border-[var(--card-border)]">
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs text-slate-200">
                              {settlement.requestId}
                            </div>
                            {settlement.memo ? (
                              <div className="mt-1 max-w-[14rem] truncate text-xs text-slate-500">
                                {settlement.memo}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {settlement.wallet?.providerCode ?? settlement.wallet?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-white">
                              {formatMoney(settlement.amount, settlement.currency)}
                            </div>
                            {Number(settlement.commissionAmount) > 0 ? (
                              <div className="mt-1 text-xs text-slate-500">
                                + {formatMoney(settlement.commissionAmount, settlement.currency)} charges
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={statusColor(settlement.status)}>
                              {settlement.status}
                            </Badge>
                            {settlement.rejectionReason ? (
                              <div className="mt-1 max-w-[14rem] text-xs text-rose-300">
                                {settlement.rejectionReason}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            <DateTimeCell value={settlement.createdAt} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            {settlement.status === "PENDING_APPROVAL" ? (
                              <button
                                type="button"
                                onClick={() => void cancelSettlement(settlement)}
                                className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                      {settlements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                            No settlement requests yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-[var(--card-border)] px-4">
                  <PaginationBar pagination={pagination} onPageChange={setPage} />
                </div>
              </>
            )}
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
