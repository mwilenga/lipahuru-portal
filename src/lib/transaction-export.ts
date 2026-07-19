import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatDateTime } from "@/lib/format";
import type { Transaction } from "@/types/api";

export type TransactionExportOptions = {
  title: string;
  filename: string;
  transactions: Transaction[];
  showMerchant?: boolean;
};

function headers(showMerchant: boolean): string[] {
  return [
    ...(showMerchant ? ["Merchant"] : []),
    "Reference",
    "Provider Ref",
    "Receipt",
    "Provider",
    "Operation",
    "MSISDN",
    "Amount",
    "Fee",
    "Net",
    "Currency",
    "Status",
    "Time",
  ];
}

function row(tx: Transaction, showMerchant: boolean): (string | number)[] {
  return [
    ...(showMerchant ? [tx.merchantName ?? ""] : []),
    tx.reference,
    tx.providerTransactionId ?? "",
    tx.providerReceiptNo ?? "",
    tx.providerCode ?? "",
    tx.operation,
    tx.msisdn,
    Number(tx.amount) || 0,
    Number(tx.fee ?? 0) || 0,
    Number(tx.net ?? tx.amount) || 0,
    tx.currency,
    tx.status,
    formatDateTime(tx.createdAt),
  ];
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function exportTransactionsExcel({
  title,
  filename,
  transactions,
  showMerchant = false,
}: TransactionExportOptions): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    [title],
    [`Exported ${formatDateTime(new Date().toISOString())}`],
    [],
    headers(showMerchant),
    ...transactions.map((tx) => row(tx, showMerchant)),
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Transactions");
  XLSX.writeFile(workbook, `${filename}-${stamp()}.xlsx`);
}

export function exportTransactionsPdf({
  title,
  filename,
  transactions,
  showMerchant = false,
}: TransactionExportOptions): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.text(title, 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Exported ${formatDateTime(new Date().toISOString())} · ${transactions.length} row(s)`, 40, 52);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 64,
    head: [headers(showMerchant)],
    body: transactions.map((tx) =>
      row(tx, showMerchant).map((cell) => String(cell)),
    ),
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 230 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 28, right: 28 },
  });

  doc.save(`${filename}-${stamp()}.pdf`);
}
