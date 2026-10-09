import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatDateTime } from "@/lib/format";
import type { SettlementRequest } from "@/types/api";

export type SettlementExportOptions = {
  title: string;
  filename: string;
  settlements: SettlementRequest[];
  showMerchant?: boolean;
};

function headers(showMerchant: boolean): string[] {
  return [
    ...(showMerchant ? ["Merchant"] : []),
    "Reference",
    "Wallet",
    "Amount",
    "Charges",
    "Total debit",
    "Currency",
    "Bank",
    "Account",
    "Status",
    "Reviewed By",
    "Initiated",
  ];
}

function row(settlement: SettlementRequest, showMerchant: boolean): (string | number)[] {
  return [
    ...(showMerchant ? [settlement.merchantName ?? ""] : []),
    settlement.requestId,
    settlement.wallet?.name ?? "",
    Number(settlement.amount) || 0,
    Number(settlement.commissionAmount) || 0,
    Number(settlement.totalDebit) || 0,
    settlement.currency,
    settlement.bankName ?? "",
    settlement.bankAccountNumber ?? "",
    settlement.status,
    settlement.reviewedBy ?? "",
    formatDateTime(settlement.createdAt),
  ];
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function exportSettlementsExcel({
  title,
  filename,
  settlements,
  showMerchant = false,
}: SettlementExportOptions): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    [title],
    [`Exported ${formatDateTime(new Date().toISOString())}`],
    [],
    headers(showMerchant),
    ...settlements.map((settlement) => row(settlement, showMerchant)),
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Settlements");
  XLSX.writeFile(workbook, `${filename}-${stamp()}.xlsx`);
}

export function exportSettlementsPdf({
  title,
  filename,
  settlements,
  showMerchant = false,
}: SettlementExportOptions): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.text(title, 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Exported ${formatDateTime(new Date().toISOString())} · ${settlements.length} row(s)`,
    40,
    52,
  );
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 64,
    head: [headers(showMerchant)],
    body: settlements.map((settlement) =>
      row(settlement, showMerchant).map((cell) => String(cell)),
    ),
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 230 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 28, right: 28 },
  });

  doc.save(`${filename}-${stamp()}.pdf`);
}
