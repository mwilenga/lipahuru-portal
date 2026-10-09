import { Card } from "@/components/ui/primitives";

export function SummaryCard({
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
