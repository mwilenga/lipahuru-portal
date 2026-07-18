"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

export type PanelTabItem<T extends string> = {
  key: T;
  label: string;
  hidden?: boolean;
};

export function PanelTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className,
}: {
  tabs: PanelTabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}) {
  const visible = tabs.filter((tab) => !tab.hidden);

  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {visible.map((tab) => (
        <button
          key={tab.key}
          className={clsx(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            activeTab === tab.key
              ? "bg-teal-500/20 text-teal-100"
              : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200",
          )}
          onClick={() => onTabChange(tab.key)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function PanelTabHeader({
  subtitle,
  children,
  className,
}: {
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "sticky top-0 z-10 -mx-4 border-b border-[var(--card-border)] bg-[var(--card)] px-4 pb-3",
        className,
      )}
    >
      {subtitle ? <p className="mb-2 text-xs text-slate-500">{subtitle}</p> : null}
      {children}
    </div>
  );
}
