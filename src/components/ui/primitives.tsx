import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--accent)] text-slate-950 hover:bg-[var(--accent-hover)]",
        variant === "secondary" &&
          "border border-[var(--card-border)] bg-slate-900 text-slate-100 hover:bg-slate-800",
        variant === "ghost" && "text-slate-300 hover:bg-slate-800",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-xl border border-[var(--card-border)] bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none ring-teal-500/30 focus:ring-2"
      {...props}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-xl border border-[var(--card-border)] bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none"
      {...props}
    />
  );
}
