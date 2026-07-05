"use client";

import { Badge } from "@/components/ui/primitives";
import { formatMoney, formatRelativeTime, providerColor, statusColor } from "@/lib/format";
import type { Transaction } from "@/types/api";

export function TransactionTable({
  transactions,
  showMerchant = false,
}: {
  transactions: Transaction[];
  showMerchant?: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-10 text-center text-sm text-slate-500">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--card-border)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Provider Ref</th>
            <th className="px-4 py-3">Receipt</th>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Operation</th>
            <th className="px-4 py-3">MSISDN</th>
            <th className="px-4 py-3">Amount</th>
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
              <td className="px-4 py-3">
                <Badge className={statusColor(tx.status)}>{tx.status}</Badge>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatRelativeTime(tx.finalizedAt ?? tx.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
