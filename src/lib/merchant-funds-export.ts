import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatDateTime } from "@/lib/format";
import type { MerchantFundsRow, MerchantFundsTotals } from "@/types/api";

export type MerchantFundsExportOptions = {
  rows: MerchantFundsRow[];
  totals: MerchantFundsTotals;
  subtitle?: string;
};

const TITLE = "Merchant funds";

const HEADERS = [
  "Merchant",
  "Email",
  "Collections",
  "Collected",
  "Charges",
  "Settled",
  "Pending settlement",
  "Net remaining",
  "Wallet balance",
  "Currency",
];

function row(item: MerchantFundsRow): (string | number)[] {
  return [
    item.merchantName,
    item.merchantEmail,
    item.collectionCount,
    Number(item.collected) || 0,
    Number(item.charges) || 0,
    Number(item.settled) || 0,
    Number(item.pendingSettlement) || 0,
    Number(item.netRemaining) || 0,
    Number(item.walletBalance) || 0,
    item.currency,
  ];
}

function totalsRow(totals: MerchantFundsTotals): (string | number)[] {
  return [
    "TOTAL",
    "",
    totals.collectionCount,
    Number(totals.collected) || 0,
    Number(totals.charges) || 0,
    Number(totals.settled) || 0,
    Number(totals.pendingSettlement) || 0,
    Number(totals.netRemaining) || 0,
    Number(totals.walletBalance) || 0,
    totals.currency,
  ];
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function caption(subtitle?: string): string {
  return [`Exported ${formatDateTime(new Date().toISOString())}`, subtitle]
    .filter(Boolean)
    .join(" · ");
}

export function exportMerchantFundsExcel({ rows, totals, subtitle }: MerchantFundsExportOptions): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    [TITLE],
    [caption(subtitle)],
    [],
    HEADERS,
    ...rows.map(row),
    totalsRow(totals),
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Merchant funds");
  XLSX.writeFile(workbook, `merchant-funds-${stamp()}.xlsx`);
}

export function exportMerchantFundsPdf({ rows, totals, subtitle }: MerchantFundsExportOptions): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.text(TITLE, 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`${caption(subtitle)} · ${rows.length} merchant(s)`, 40, 52);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 64,
    head: [HEADERS],
    body: rows.map((item) => row(item).map((cell) => String(cell))),
    foot: [totalsRow(totals).map((cell) => String(cell))],
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 230 },
    footStyles: { fillColor: [226, 232, 240], textColor: 15, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 28, right: 28 },
  });

  doc.save(`merchant-funds-${stamp()}.pdf`);
}
