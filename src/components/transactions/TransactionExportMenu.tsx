"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import clsx from "clsx";
import {
  exportTransactionsExcel,
  exportTransactionsPdf,
} from "@/lib/transaction-export";
import type { Transaction } from "@/types/api";

export function TransactionExportMenu({
  title = "Transactions",
  filename = "transactions",
  showMerchant = false,
  disabled = false,
  loadRows,
}: {
  title?: string;
  filename?: string;
  showMerchant?: boolean;
  disabled?: boolean;
  loadRows: () => Promise<Transaction[]>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function run(kind: "excel" | "pdf") {
    setBusy(kind);
    setError("");
    try {
      const rows = await loadRows();
      if (rows.length === 0) {
        setError("No transactions to export for the current filters.");
        return;
      }
      const payload = { title, filename, transactions: rows, showMerchant };
      if (kind === "excel") {
        exportTransactionsExcel(payload);
      } else {
        exportTransactionsPdf(payload);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled || busy !== null}
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          "inline-flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-slate-950 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-900 hover:text-white disabled:opacity-50",
        )}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-48 rounded-xl border border-[var(--card-border)] bg-slate-950 p-1 shadow-xl">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900"
            disabled={busy !== null}
            onClick={() => void run("excel")}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-300" />
            Excel (.xlsx)
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900"
            disabled={busy !== null}
            onClick={() => void run("pdf")}
          >
            <FileText className="h-4 w-4 text-rose-300" />
            PDF (.pdf)
          </button>
          {error ? <p className="px-3 py-2 text-xs text-red-400">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
