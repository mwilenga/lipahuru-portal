"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { WalletTransferExportMenu } from "@/components/transfers/WalletTransferExportMenu";
import { DateInput } from "@/components/ui/DateInput";
import { DateTimeCell } from "@/components/ui/DateTimeCell";
import { FilterCard, FilterField } from "@/components/ui/FilterCard";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { apiFetch, ApiError } from "@/lib/api";
import { formatMoney, statusColor } from "@/lib/format";
import { WALLET_TRANSFER_STATUS_OPTIONS } from "@/lib/select-options";
import type {
  Merchant,
  Pagination,
  TransferableWallet,
  WalletTransfer,
} from "@/types/api";

const PER_PAGE = 10;

function walletLabel(wallet: TransferableWallet): string {
  return `${wallet.name} — ${formatMoney(wallet.available, wallet.currency)}`;
}

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING_APPROVAL");
  const [merchantId, setMerchantId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [panelOpen, setPanelOpen] = useState(false);
  const [instantMerchantId, setInstantMerchantId] = useState("");
  const [instantWallets, setInstantWallets] = useState<TransferableWallet[]>([]);
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);

  const merchantFilterOptions = useMemo(
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

  const instantMerchantOptions = useMemo(
    () =>
      merchants.map((merchant) => ({
        value: String(merchant.id),
        label: merchant.name,
        description: merchant.email,
      })),
    [merchants],
  );

  const selectedFromWallet = useMemo(
    () => instantWallets.find((wallet) => String(wallet.walletId) === fromWalletId),
    [instantWallets, fromWalletId],
  );

  const fromOptions = useMemo(
    () =>
      instantWallets.map((wallet) => ({
        value: String(wallet.walletId),
        label: walletLabel(wallet),
        description: wallet.walletType.replace("_", " "),
      })),
    [instantWallets],
  );

  const toOptions = useMemo(
    () =>
      instantWallets
        .filter((wallet) => String(wallet.walletId) !== fromWalletId)
        .map((wallet) => ({
          value: String(wallet.walletId),
          label: walletLabel(wallet),
          description: wallet.walletType.replace("_", " "),
        })),
    [instantWallets, fromWalletId],
  );

  const insufficient =
    selectedFromWallet !== undefined &&
    amount.trim() !== "" &&
    Number(amount) > Number(selectedFromWallet.available);

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

  const loadTransfers = useCallback(
    (pageNum: number) => {
      setLoading(true);
      return apiFetch<{ transfers: WalletTransfer[]; pagination: Pagination }>(
        `/admin/v1/wallet-transfers?${buildParams(pageNum, PER_PAGE).toString()}`,
      )
        .then((data) => {
          setTransfers(data.transfers);
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
    void loadTransfers(page);
  }, [loadTransfers, page]);

  useEffect(() => {
    setFromWalletId("");
    setToWalletId("");

    if (!instantMerchantId) {
      setInstantWallets([]);
      return;
    }

    apiFetch<{ wallets: TransferableWallet[] }>(
      `/admin/v1/wallet-transfers/transferable-wallets/${instantMerchantId}`,
    )
      .then((data) => setInstantWallets(data.wallets))
      .catch(() => setInstantWallets([]));
  }, [instantMerchantId]);

  async function approveTransfer(transfer: WalletTransfer) {
    setActionError(null);
    try {
      await apiFetch(`/admin/v1/wallet-transfers/${transfer.id}/approve`, {
        method: "POST",
      });
      await loadTransfers(page);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Approve failed");
    }
  }

  async function rejectTransfer(transfer: WalletTransfer) {
    const reason = window.prompt(
      `Reject ${transfer.transferId}? Optional reason:`,
    );
    if (reason === null) return;

    setActionError(null);
    try {
      await apiFetch(`/admin/v1/wallet-transfers/${transfer.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      await loadTransfers(page);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Reject failed");
    }
  }

  async function submitInstantTransfer(e: React.FormEvent) {
    e.preventDefault();
    setPanelError(null);

    if (!instantMerchantId || !fromWalletId || !toWalletId) {
      setPanelError("Select a merchant and both wallets.");
      return;
    }

    if (amount.trim() === "" || Number(amount) < 100) {
      setPanelError("Enter an amount of at least 100.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<WalletTransfer>("/admin/v1/wallet-transfers", {
        method: "POST",
        body: JSON.stringify({
          merchantId: Number(instantMerchantId),
          fromWalletId: Number(fromWalletId),
          toWalletId: Number(toWalletId),
          amount: amount.trim(),
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      setPanelOpen(false);
      setInstantMerchantId("");
      setFromWalletId("");
      setToWalletId("");
      setAmount("");
      setReference("");
      setNotes("");
      setStatus("");
      setPage(1);
      await loadTransfers(1);
    } catch (err) {
      setPanelError(err instanceof ApiError ? err.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title="Transfers"
        subtitle="Approve merchant wallet transfers or move funds instantly"
      >
        <div className="space-y-4">
          <FilterCard>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <FilterField label="Search">
                <Input
                  placeholder="Transfer ID / reference"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </FilterField>
              <FilterField label="Merchant">
                <StaticSearchableSelect
                  value={merchantId}
                  onChange={setMerchantId}
                  options={merchantFilterOptions}
                  placeholder="All merchants"
                />
              </FilterField>
              <FilterField label="Status">
                <StaticSearchableSelect
                  value={status}
                  onChange={setStatus}
                  options={WALLET_TRANSFER_STATUS_OPTIONS}
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

          {actionError ? (
            <p className="text-sm text-rose-300">{actionError}</p>
          ) : null}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-white">Transfer requests</h2>
                {loading ? (
                  <span className="text-xs text-slate-500">Loading…</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <WalletTransferExportMenu
                  title="Wallet transfers"
                  filename="wallet-transfers"
                  showMerchant
                  loadRows={async () => {
                    const data = await apiFetch<{ transfers: WalletTransfer[] }>(
                      `/admin/v1/wallet-transfers?${buildParams(1, 500).toString()}`,
                    );
                    return data.transfers;
                  }}
                />
                <Button type="button" onClick={() => setPanelOpen(true)}>
                  Instant transfer
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Reference</th>
                    <th className="px-3 py-2">Merchant</th>
                    <th className="px-3 py-2">From</th>
                    <th className="px-3 py-2">To</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Initiated</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr
                      key={transfer.id}
                      className="border-t border-[var(--card-border)]"
                    >
                      <td className="px-3 py-3">
                        <div className="font-mono text-xs text-slate-200">
                          {transfer.transferId}
                        </div>
                        {transfer.reference ? (
                          <div className="mt-1 text-xs text-slate-500">
                            {transfer.reference}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-slate-200">
                        {transfer.merchantName ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {transfer.fromWallet?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {transfer.toWallet?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-white">
                        {formatMoney(transfer.amount, transfer.currency)}
                      </td>
                      <td className="px-3 py-3 text-slate-400">{transfer.source}</td>
                      <td className="px-3 py-3">
                        <Badge className={statusColor(transfer.status)}>
                          {transfer.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        <DateTimeCell value={transfer.createdAt} />
                      </td>
                      <td className="px-3 py-3">
                        {transfer.status === "PENDING_APPROVAL" ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => approveTransfer(transfer)}
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => rejectTransfer(transfer)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {transfer.reviewedBy ? `By ${transfer.reviewedBy}` : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loading && transfers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                        No transfers found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <PaginationBar pagination={pagination} onPageChange={setPage} />
          </Card>
        </div>

        <SlidePanel
          open={panelOpen}
          title="Instant transfer"
          onClose={() => setPanelOpen(false)}
        >
          <form onSubmit={submitInstantTransfer} className="space-y-4">
            <FilterField label="Merchant">
              <StaticSearchableSelect
                value={instantMerchantId}
                onChange={setInstantMerchantId}
                options={instantMerchantOptions}
                placeholder="Select merchant"
              />
            </FilterField>
            <FilterField label="From wallet">
              <StaticSearchableSelect
                value={fromWalletId}
                onChange={(value) => {
                  setFromWalletId(value);
                  if (value === toWalletId) setToWalletId("");
                }}
                options={fromOptions}
                placeholder="Select source wallet"
              />
            </FilterField>
            <FilterField label="To wallet">
              <StaticSearchableSelect
                value={toWalletId}
                onChange={setToWalletId}
                options={toOptions}
                placeholder="Select destination wallet"
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

            {selectedFromWallet ? (
              <p className="text-xs text-slate-500">
                Available:{" "}
                {formatMoney(
                  selectedFromWallet.available,
                  selectedFromWallet.currency,
                )}
              </p>
            ) : null}
            {insufficient ? (
              <p className="text-xs text-amber-300">
                Amount exceeds the available balance on the source wallet.
              </p>
            ) : null}

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

            {panelError ? (
              <p className="text-sm text-rose-300">{panelError}</p>
            ) : null}

            <p className="text-xs text-slate-500">
              This moves the funds immediately without an approval step.
            </p>

            <Button
              type="submit"
              disabled={submitting || insufficient}
              className="w-full"
            >
              {submitting ? "Transferring…" : "Transfer now"}
            </Button>
          </form>
        </SlidePanel>
      </AppShell>
    </AuthGuard>
  );
}
