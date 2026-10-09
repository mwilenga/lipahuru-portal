import { Card } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/format";
import type { TransactionSummary } from "@/types/api";

function SummaryCard({
  label,
  value,
  hint,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  hint: string;
  valueClassName?: string;
}) {
  return (
    <Card className="!p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1.5 text-2xl font-semibold ${valueClassName}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-400">{hint}</div>
    </Card>
  );
}

export function TransactionSummaryCards({
  summary,
  operation,
}: {
  summary: TransactionSummary | null;
  operation?: string;
}) {
  const money = (amount: string | undefined) =>
    summary ? formatMoney(amount ?? "0", summary.currency) : "—";

  const grossLabel =
    operation === "B2C_DISBURSEMENT"
      ? "Gross disbursed"
      : operation === "C2B_USSD_PUSH"
        ? "Gross collected"
        : "Gross (successful)";
  const netLabel =
    operation === "B2C_DISBURSEMENT"
      ? "Net disbursed"
      : operation === "C2B_USSD_PUSH"
        ? "Net collection"
        : "Net amount";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label={grossLabel}
        value={money(summary?.successAmount)}
        hint={summary ? `${summary.successCount ?? 0} successful transaction(s)` : "—"}
      />
      <SummaryCard
        label="Transaction charges"
        value={money(summary?.feeAmount)}
        hint="On successful transactions"
        valueClassName="text-amber-300"
      />
      <SummaryCard
        label={netLabel}
        value={money(summary?.netAmount)}
        hint="Gross minus charges"
        valueClassName="text-teal-300"
      />
      <SummaryCard
        label="Total amount (all statuses)"
        value={money(summary?.totalAmount)}
        hint={summary ? `${summary.count} transaction(s)` : "—"}
      />
    </div>
  );
}
