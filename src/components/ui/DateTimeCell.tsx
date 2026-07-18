import { formatDateTime, formatRelativeTime } from "@/lib/format";

export function DateTimeCell({ value }: { value?: string }) {
  if (!value) {
    return <span className="text-slate-500">—</span>;
  }

  return (
    <div className="leading-tight">
      <div className="whitespace-nowrap text-slate-300">{formatDateTime(value)}</div>
      <div className="mt-0.5 text-xs text-slate-500">{formatRelativeTime(value)}</div>
    </div>
  );
}
