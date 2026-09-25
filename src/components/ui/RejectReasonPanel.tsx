"use client";

import { useEffect, useState } from "react";
import { FilterField } from "@/components/ui/FilterCard";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { Button } from "@/components/ui/primitives";

export function RejectReasonPanel({
  open,
  title,
  description,
  submitLabel = "Reject",
  reasonRequired = false,
  submitting = false,
  error = null,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description?: string;
  submitLabel?: string;
  reasonRequired?: boolean;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (reasonRequired && trimmed === "") return;
    await onSubmit(trimmed);
  }

  return (
    <SlidePanel open={open} title={title} onClose={onClose}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {description ? (
          <p className="text-sm text-slate-400">{description}</p>
        ) : null}
        <FilterField label={reasonRequired ? "Reason" : "Reason (optional)"}>
          <textarea
            className="min-h-28 w-full rounded-xl border border-[var(--card-border)] bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none ring-teal-500/30 focus:ring-2"
            placeholder="Add a remark for the merchant…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required={reasonRequired}
          />
        </FilterField>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 !bg-rose-600 hover:!bg-rose-500"
            disabled={submitting || (reasonRequired && reason.trim() === "")}
          >
            {submitting ? "Submitting…" : submitLabel}
          </Button>
        </div>
      </form>
    </SlidePanel>
  );
}
