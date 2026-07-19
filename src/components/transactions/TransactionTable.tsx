"use client";

import { DateTimeCell } from "@/components/ui/DateTimeCell";
import { TransactionExportMenu } from "@/components/transactions/TransactionExportMenu";
import { Badge } from "@/components/ui/primitives";
import { formatMoney, providerColor, statusColor } from "@/lib/format";
import type { Transaction } from "@/types/api";

export function TransactionTable({
  transactions,
  showMerchant = false,
  title = "Transactions",
  exportFilename = "transactions",
  loadExportRows,
  showHeader = true,
}: {
  transactions: Transaction[];
  showMerchant?: boolean;
  title?: string;
  exportFilename?: string;
  loadExportRows?: () => Promise<Transaction[]>;
  showHeader?: boolean;
}) {
  const canExport = Boolean(loadExportRows);

  const empty = (
    <div
      className={
        showHeader
          ? "p-10 text-center text-sm text-slate-500"
          : "rounded-2xl border border-dashed border-[var(--card-border)] p-10 text-center text-sm text-slate-500"
      }
    >
      No transactions found.
    </div>
  );

  const tableBody =
    transactions.length === 0 ? (
      empty
    ) : (
      <div
        className={
          showHeader
            ? "overflow-x-auto"
            : "overflow-x-auto rounded-2xl border border-[var(--card-border)]"
        }
      >
        <table className="min-w-[720px] w-full text-left text-sm sm:min-w-full">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {showMerchant ? <th className="px-4 py-3">Merchant</th> : null}
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Provider Ref</th>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Operation</th>
              <th className="px-4 py-3">MSISDN</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.transactionId}
                className="border-t border-[var(--card-border)] hover:bg-slate-900/40"
              >
                {showMerchant ? (
                  <td className="px-4 py-3 text-slate-300">
                    {tx.merchantName ?? "—"}
                  </td>
                ) : null}
                <td className="px-4 py-3 font-mono text-xs text-teal-300">
                  {tx.reference}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  {tx.providerTransactionId ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {tx.providerReceiptNo ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={providerColor(tx.providerCode)}>
                    {tx.providerCode ?? "—"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-300">{tx.operation}</td>
                <td className="px-4 py-3 text-slate-300">{tx.msisdn}</td>
                <td className="px-4 py-3 font-medium text-white">
                  {formatMoney(tx.amount, tx.currency)}
                </td>
                <td className="px-4 py-3 text-amber-200/90">
                  {formatMoney(tx.fee ?? "0", tx.currency)}
                </td>
                <td className="px-4 py-3 font-medium text-emerald-300">
                  {formatMoney(tx.net ?? tx.amount, tx.currency)}
                </td>
                <td className="px-4 py-3">
                  <Badge className={statusColor(tx.status)}>{tx.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <DateTimeCell value={tx.createdAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  if (!showHeader) {
    return tableBody;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--card-border)] px-4 py-3">
        <h3 className="text-base font-medium text-white">{title}</h3>
        {canExport && loadExportRows ? (
          <TransactionExportMenu
            title={title}
            filename={exportFilename}
            showMerchant={showMerchant}
            disabled={transactions.length === 0}
            loadRows={loadExportRows}
          />
        ) : null}
      </div>
      {tableBody}
    </div>
  );
}
