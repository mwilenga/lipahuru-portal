"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

export function SlidePanel({
  open,
  title,
  onClose,
  children,
  panelClassName,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
}) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!isClient || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        aria-label="Close panel"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="slide-panel-title"
        aria-modal="true"
        className={clsx(
          "relative flex h-full w-full max-w-md flex-col border-l border-[var(--card-border)] bg-[var(--card)] shadow-2xl",
          panelClassName,
        )}
        role="dialog"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-white" id="slide-panel-title">
            {title}
          </h2>
          <button
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 text-slate-100">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
