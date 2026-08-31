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
  Pagination,
  TransferableWallet,
  WalletTransfer,
} from "@/types/api";

const PER_PAGE = 10;

function walletLabel(wallet: TransferableWallet): string {
  return `${wallet.name} — ${formatMoney(wallet.available, wallet.currency)}`;
}

export default function MerchantTransfersPage() {
  const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<TransferableWallet[]>([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [panelOpen, setPanelOpen] = useState(false);
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedFromWallet = useMemo(
    () => wallets.find((wallet) => String(wallet.walletId) === fromWalletId),
    [wallets, fromWalletId],
  );

  const fromOptions = useMemo(
    () =>
      wallets.map((wallet) => ({
        value: String(wallet.walletId),
        label: walletLabel(wallet),
        description: wallet.walletType.replace("_", " "),
      })),
    [wallets],
  );

  const toOptions = useMemo(
    () =>
      wallets
        .filter((wallet) => String(wallet.walletId) !== fromWalletId)
        .map((wallet) => ({
          value: String(wallet.walletId),
          label: walletLabel(wallet),
          description: wallet.walletType.replace("_", " "),
        })),
    [wallets, fromWalletId],
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
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return params;
    },
    [search, status, from, to],
  );

  const loadWallets = useCallback(
    () =>
      apiFetch<{ wallets: TransferableWallet[] }>(
        "/v1/portal/wallet-transfers/transferable-wallets",
      ).then((data) => setWallets(data.wallets)),
    [],
  );

  const loadTransfers = useCallback(
    (pageNum: number) => {
      setLoading(true);
      return apiFetch<{ transfers: WalletTransfer[]; pagination: Pagination }>(
        `/v1/portal/wallet-transfers?${buildParams(pageNum, PER_PAGE).toString()}`,
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
    void loadWallets();
  }, [loadWallets]);

  useEffect(() => {
    setPage(1);
  }, [search, status, from, to]);

  useEffect(() => {
    void loadTransfers(page);
  }, [loadTransfers, page]);

  async function submitTransfer(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fromWalletId || !toWalletId) {
      setError("Select both source and destination wallets.");
      return;
    }

    if (amount.trim() === "" || Number(amount) < 100) {
      setError("Enter an amount of at least 100.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<WalletTransfer>("/v1/portal/wallet-transfers", {
        method: "POST",
        body: JSON.stringify({
          fromWalletId: Number(fromWalletId),
          toWalletId: Number(toWalletId),
          amount: amount.trim(),
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      setPanelOpen(false);
      setFromWalletId("");
      setToWalletId("");
      setAmount("");
      setReference("");
      setNotes("");
      setSuccess("Transfer request submitted. Waiting for admin approval.");
      setPage(1);
      await Promise.all([loadTransfers(1), loadWallets()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit transfer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard role="merchant">
      <AppShell
        role="merchant"
        title="Transfers"
        subtitle="Move funds between your collection and disbursement wallets"
      >
        <div className="space-y-4">
          <FilterCard>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Search">
                <Input
                  placeholder="Transfer ID / reference"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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

          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-white">Transfer history</h2>
                {loading ? (
                  <span className="text-xs text-slate-500">Loading…</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <WalletTransferExportMenu
                  title="Wallet transfers"
                  filename="wallet-transfers"
                  loadRows={async () => {
                    const data = await apiFetch<{ transfers: WalletTransfer[] }>(
                      `/v1/portal/wallet-transfers?${buildParams(1, 500).toString()}`,
                    );
                    return data.transfers;
                  }}
                />
                <Button type="button" onClick={() => setPanelOpen(true)}>
                  New transfer
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Reference</th>
                    <th className="px-3 py-2">From</th>
                    <th className="px-3 py-2">To</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Initiated</th>
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
                      <td className="px-3 py-3 text-slate-300">
                        {transfer.fromWallet?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {transfer.toWallet?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-white">
                        {formatMoney(transfer.amount, transfer.currency)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={statusColor(transfer.status)}>
                          {transfer.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        <DateTimeCell value={transfer.createdAt} />
                      </td>
                    </tr>
                  ))}
                  {!loading && transfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                        No transfers yet.
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
          title="New transfer"
          onClose={() => setPanelOpen(false)}
        >
          <form onSubmit={submitTransfer} className="space-y-4">
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
                placeholder="Optional notes for admin"
              />
            </FilterField>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <p className="text-xs text-slate-500">
              The amount is held on the source wallet until an admin approves the
              transfer.
            </p>

            <Button
              type="submit"
              disabled={submitting || insufficient}
              className="w-full"
            >
              {submitting ? "Submitting…" : "Submit transfer request"}
            </Button>
          </form>
        </SlidePanel>
      </AppShell>
    </AuthGuard>
  );
}
