"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import clsx from "clsx";
import {
  dismissToast,
  subscribeToasts,
  type ToastItem,
  type ToastTone,
} from "@/lib/toast";

const toneStyles: Record<
  ToastTone,
  { wrap: string; icon: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    wrap: "border-teal-500/30 bg-slate-950/95 shadow-teal-500/10",
    icon: "text-teal-300",
    Icon: CheckCircle2,
  },
  error: {
    wrap: "border-rose-500/35 bg-slate-950/95 shadow-rose-500/10",
    icon: "text-rose-300",
    Icon: XCircle,
  },
  info: {
    wrap: "border-sky-500/30 bg-slate-950/95 shadow-sky-500/10",
    icon: "text-sky-300",
    Icon: Info,
  },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(100%-2rem,22rem)] flex-col gap-2"
    >
      {items.map((item) => {
        const tone = toneStyles[item.tone];
        const Icon = tone.Icon;
        return (
          <div
            key={item.id}
            className={clsx(
              "pointer-events-auto animate-[toast-in_280ms_ease-out] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md",
              tone.wrap,
            )}
            role="status"
          >
            <div className="flex items-start gap-3">
              <Icon className={clsx("mt-0.5 h-5 w-5 shrink-0", tone.icon)} />
              <div className="min-w-0 flex-1">
                {item.title ? (
                  <div className="text-sm font-medium text-white">{item.title}</div>
                ) : null}
                <p className="mt-0.5 text-sm leading-snug text-slate-300">
                  {item.message}
                </p>
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                onClick={() => dismissToast(item.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
