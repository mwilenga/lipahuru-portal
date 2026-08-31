import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatDateTime } from "@/lib/format";
import type { WalletTransfer } from "@/types/api";

export type WalletTransferExportOptions = {
  title: string;
  filename: string;
  transfers: WalletTransfer[];
  showMerchant?: boolean;
};

function headers(showMerchant: boolean): string[] {
  return [
    ...(showMerchant ? ["Merchant"] : []),
    "Transfer ID",
    "Reference",
    "From",
    "To",
    "Amount",
    "Currency",
    "Status",
    "Source",
    "Reviewed By",
    "Initiated",
  ];
}

function row(transfer: WalletTransfer, showMerchant: boolean): (string | number)[] {
  return [
    ...(showMerchant ? [transfer.merchantName ?? ""] : []),
    transfer.transferId,
    transfer.reference ?? "",
    transfer.fromWallet?.name ?? "",
    transfer.toWallet?.name ?? "",
    Number(transfer.amount) || 0,
    transfer.currency,
    transfer.status,
    transfer.source,
    transfer.reviewedBy ?? "",
    formatDateTime(transfer.createdAt),
  ];
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function exportWalletTransfersExcel({
  title,
  filename,
  transfers,
  showMerchant = false,
}: WalletTransferExportOptions): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    [title],
    [`Exported ${formatDateTime(new Date().toISOString())}`],
    [],
    headers(showMerchant),
    ...transfers.map((transfer) => row(transfer, showMerchant)),
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Transfers");
  XLSX.writeFile(workbook, `${filename}-${stamp()}.xlsx`);
}

export function exportWalletTransfersPdf({
  title,
  filename,
  transfers,
  showMerchant = false,
}: WalletTransferExportOptions): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.text(title, 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Exported ${formatDateTime(new Date().toISOString())} · ${transfers.length} row(s)`,
    40,
    52,
  );
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 64,
    head: [headers(showMerchant)],
    body: transfers.map((transfer) =>
      row(transfer, showMerchant).map((cell) => String(cell)),
    ),
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 230 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 28, right: 28 },
  });

  doc.save(`${filename}-${stamp()}.pdf`);
}
