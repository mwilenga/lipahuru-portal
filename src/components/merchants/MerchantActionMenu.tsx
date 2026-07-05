"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle, KeyRound, MoreVertical, Pencil } from "lucide-react";
import type { Merchant } from "@/types/api";

export function MerchantActionMenu({
  merchant,
  onApprove,
  onDisable,
}: {
  merchant: Merchant;
  onApprove: () => Promise<void>;
  onDisable: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg border border-[var(--card-border)] p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
        aria-label="Merchant actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--card-border)] bg-slate-950 shadow-xl">
          <Link
            href={`/admin/merchants/${merchant.id}/edit`}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-900"
            onClick={() => setOpen(false)}
          >
            <Pencil className="h-4 w-4 text-slate-400" />
            Edit
          </Link>
          <Link
            href={`/admin/merchants/${merchant.id}`}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-900"
            onClick={() => setOpen(false)}
          >
            <KeyRound className="h-4 w-4 text-slate-400" />
            View credentials
          </Link>
          {merchant.status === "PENDING" || merchant.status === "SUSPENDED" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(onApprove)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-emerald-300 hover:bg-slate-900 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {merchant.status === "PENDING" ? "Approve" : "Enable"}
            </button>
          ) : null}
          {merchant.status === "ACTIVE" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(onDisable)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-300 hover:bg-slate-900 disabled:opacity-50"
            >
              <Ban className="h-4 w-4" />
              Disable merchant
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
