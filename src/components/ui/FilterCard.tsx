"use client";

import type { ReactNode } from "react";
import { Filter } from "lucide-react";
import clsx from "clsx";

export function FilterCard({
  children,
  className,
  title = "Filters",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
        <Filter className="h-4 w-4 text-teal-300" />
        {title}
      </div>
      {children}
    </div>
  );
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
