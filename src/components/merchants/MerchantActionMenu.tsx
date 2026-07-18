"use client";

import { Ban, CheckCircle, KeyRound, Pencil } from "lucide-react";
import {
  RowActionsMenu,
  rowActionItemClass,
} from "@/components/ui/RowActionsMenu";
import type { Merchant } from "@/types/api";

export function MerchantActionMenu({
  merchant,
  onEdit,
  onCredentials,
  onApprove,
  onDisable,
}: {
  merchant: Merchant;
  onEdit: () => void;
  onCredentials: () => void;
  onApprove: () => Promise<void>;
  onDisable: () => Promise<void>;
}) {
  return (
    <RowActionsMenu>
      <button type="button" className={rowActionItemClass} onClick={onEdit}>
        <span className="inline-flex items-center gap-2">
          <Pencil className="h-4 w-4 text-slate-400" />
          Edit
        </span>
      </button>
      <button type="button" className={rowActionItemClass} onClick={onCredentials}>
        <span className="inline-flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-slate-400" />
          View credentials
        </span>
      </button>
      {merchant.status === "PENDING" || merchant.status === "SUSPENDED" ? (
        <button
          type="button"
          className={`${rowActionItemClass} text-emerald-300`}
          onClick={() => void onApprove()}
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {merchant.status === "PENDING" ? "Approve" : "Enable"}
          </span>
        </button>
      ) : null}
      {merchant.status === "ACTIVE" ? (
        <button
          type="button"
          className={`${rowActionItemClass} text-red-300`}
          onClick={() => void onDisable()}
        >
          <span className="inline-flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Disable merchant
          </span>
        </button>
      ) : null}
    </RowActionsMenu>
  );
}
