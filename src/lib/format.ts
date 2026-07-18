export function formatMoney(amount: string | number, currency = "TZS"): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;

  if (Number.isNaN(value)) {
    return `${currency} 0`;
  }

  const prefix = currency === "TZS" ? "TSh" : currency;

  return `${prefix} ${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Display & filter calendar days in East Africa Time. */
export const APP_TIMEZONE = "Africa/Dar_es_Salaam";

export function formatRelativeTime(iso?: string): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Format as YYYY-MM-DD HH:mm:ss in APP_TIMEZONE. */
export function formatDateTime(iso?: string): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}


export function providerColor(code?: string): string {
  switch (code?.toUpperCase()) {
    case "VODACOM":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "YAS":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "HALOTEL":
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "AIRTEL":
      return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  }
}

export function statusColor(status?: string): string {
  switch (status?.toUpperCase()) {
    case "SUCCESS":
    case "ACTIVE":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "FAILED":
    case "SUSPENDED":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "PENDING":
    case "PENDING_FINAL":
    case "ACKNOWLEDGED":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}
