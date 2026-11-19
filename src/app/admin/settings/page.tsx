"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DateInput } from "@/components/ui/DateInput";
import { DateTimeCell } from "@/components/ui/DateTimeCell";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  RowActionsMenu,
  rowActionItemClass,
} from "@/components/ui/RowActionsMenu";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Badge, Button, Input } from "@/components/ui/primitives";
import { apiFetch, apiRequest, ApiError } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { formatMoney, providerColor } from "@/lib/format";
import { COMMISSION_TYPE_OPTIONS } from "@/lib/select-options";
import { toast } from "@/lib/toast";
import type { ProviderFeeRate, ProviderNetworkOption } from "@/types/api";

const OPERATION_OPTIONS = [
  { value: "C2B_USSD_PUSH", label: "Collection (C2B)" },
  { value: "B2C_DISBURSEMENT", label: "Disbursement (B2C)" },
];

const OPERATION_FILTER_OPTIONS = [
  { value: "", label: "All operations" },
  { value: "C2B_USSD_PUSH", label: "Collection (C2B)" },
  { value: "B2C_DISBURSEMENT", label: "Disbursement (B2C)" },
];

type SettingsTab = "provider-charge";

function todayDateInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDateInput(value?: string): string {
  if (!value) return todayDateInput();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayDateInput();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AdminSettingsPage() {
  const [tab] = useState<SettingsTab>("provider-charge");
  const [rates, setRates] = useState<ProviderFeeRate[]>([]);
  const [networks, setNetworks] = useState<ProviderNetworkOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [defaultNetworkId, setDefaultNetworkId] = useState("");
  const [operationFilter, setOperationFilter] = useState("");

  const [providerNetworkId, setProviderNetworkId] = useState("");
  const [operation, setOperation] = useState("C2B_USSD_PUSH");
  const [commissionType, setCommissionType] = useState("PERCENT");
  const [value, setValue] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateInput());
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const networkOptions = useMemo(
    () =>
      networks.map((network) => ({
        value: String(network.id),
        label: `${network.code} — ${network.name}`,
      })),
    [networks],
  );

  const filteredRates = useMemo(() => {
    if (!operationFilter) return rates;
    return rates.filter((rate) => rate.operation === operationFilter);
  }, [rates, operationFilter]);

  const otherActiveForPair = useMemo(() => {
    if (!providerNetworkId || !isActive) return null;
    return (
      rates.find(
        (rate) =>
          String(rate.providerNetworkId) === providerNetworkId &&
          rate.operation === operation &&
          rate.isActive &&
          rate.id !== editingId,
      ) ?? null
    );
  }, [rates, providerNetworkId, operation, isActive, editingId]);

  const resetForm = useCallback((networkId?: string) => {
    const fallback = networkId || defaultNetworkId;
    setEditingId(null);
    setOperation("C2B_USSD_PUSH");
    setCommissionType("PERCENT");
    setValue("");
    setNotes("");
    setIsActive(true);
    setEffectiveFrom(todayDateInput());
    setProviderNetworkId(fallback);
    setError(null);
  }, [defaultNetworkId]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    resetForm();
  }, [resetForm]);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const [ratesData, networksData] = await Promise.all([
        apiFetch<{ rates: ProviderFeeRate[] }>(
          "/admin/v1/settings/provider-fee-rates",
        ),
        apiFetch<ProviderNetworkOption[]>("/admin/v1/networks"),
      ]);
      setRates(ratesData.rates ?? []);
      setNetworks(Array.isArray(networksData) ? networksData : []);
      const firstNetworkId =
        Array.isArray(networksData) && networksData[0]
          ? String(networksData[0].id)
          : "";
      setDefaultNetworkId(firstNetworkId);
      setProviderNetworkId((current) => current || firstNetworkId);
    } catch (err) {
      setListError(
        err instanceof ApiError ? err.message : "Failed to load settings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openAdd() {
    resetForm(defaultNetworkId);
    setPanelOpen(true);
  }

  function startEdit(rate: ProviderFeeRate) {
    setEditingId(rate.id);
    setProviderNetworkId(String(rate.providerNetworkId));
    setOperation(rate.operation);
    setCommissionType(rate.commissionType);
    setValue(String(Number(rate.value)));
    setEffectiveFrom(toDateInput(rate.effectiveFrom));
    setNotes(rate.notes ?? "");
    setIsActive(rate.isActive);
    setError(null);
    setPanelOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!providerNetworkId || !value) {
      setError("Network and value are required.");
      return;
    }

    if (isActive && otherActiveForPair) {
      const confirmed = await confirmAction({
        title: "Replace active rate?",
        text: `Another active ${otherActiveForPair.providerCode ?? "network"} ${otherActiveForPair.operation} rate already exists. Saving will deactivate it so only one rate stays active for this network and operation.`,
        confirmButtonText: "Yes, make this active",
        icon: "warning",
      });
      if (!confirmed) return;
    }

    setSubmitting(true);
    setError(null);
    const payload = {
      providerNetworkId: Number(providerNetworkId),
      operation,
      commissionType,
      value,
      effectiveFrom: effectiveFrom || undefined,
      notes: notes.trim() || null,
      isActive,
    };

    try {
      if (editingId != null) {
        const { message } = await apiRequest(
          `/admin/v1/settings/provider-fee-rates/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
        toast.success(message || "Provider fee rate updated");
      } else {
        const { message } = await apiRequest(
          "/admin/v1/settings/provider-fee-rates",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
        toast.success(message || "Provider fee rate added");
      }
      closePanel();
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : editingId != null
            ? "Failed to update rate"
            : "Failed to add rate",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(rate: ProviderFeeRate) {
    const confirmed = await confirmAction({
      title: "Delete provider fee rate?",
      text: `Delete ${rate.providerCode ?? "network"} ${rate.operation} (${rate.commissionType} ${rate.value})? This cannot be undone.`,
      confirmButtonText: "Yes, delete",
      icon: "warning",
    });
    if (!confirmed) return;

    try {
      const { message } = await apiRequest(
        `/admin/v1/settings/provider-fee-rates/${rate.id}`,
        { method: "DELETE" },
      );
      toast.success(message || "Provider fee rate deleted");
      if (editingId === rate.id) {
        closePanel();
      }
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete rate");
    }
  }

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title="Settings"
        subtitle="Platform configuration"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-[var(--card-border)] pb-3">
            <button
              type="button"
              className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-sm text-teal-200"
            >
              Provider transaction charge
            </button>
          </div>

          {tab === "provider-charge" ? (
            <div className="space-y-4">
              {listError ? (
                <p className="text-sm text-red-400">{listError}</p>
              ) : null}

              {loading ? (
                <PageLoader label="Loading provider fee rates…" />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] px-4 py-3">
                    <div>
                      <h3 className="text-base font-medium text-white">
                        Provider fee rates
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Only one active rate per network and operation.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-48">
                        <StaticSearchableSelect
                          value={operationFilter}
                          onChange={setOperationFilter}
                          options={OPERATION_FILTER_OPTIONS}
                          placeholder="Filter operation"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={openAdd}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add rate
                      </Button>
                    </div>
                  </div>
                  {rates.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No provider fee rates yet. Add the current active rates
                      per network and operation.
                    </div>
                  ) : filteredRates.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No rates match this operation filter.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-[720px] w-full text-left text-sm">
                        <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Network</th>
                            <th className="px-4 py-3">Operation</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Value</th>
                            <th className="px-4 py-3">Effective from</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRates.map((rate) => (
                            <tr
                              key={rate.id}
                              className="border-t border-[var(--card-border)]"
                            >
                              <td className="px-4 py-3">
                                <Badge
                                  className={providerColor(rate.providerCode)}
                                >
                                  {rate.providerCode ?? "—"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-slate-300">
                                {rate.operation}
                              </td>
                              <td className="px-4 py-3 text-slate-300">
                                {rate.commissionType}
                              </td>
                              <td className="px-4 py-3 font-medium text-white">
                                {rate.commissionType === "PERCENT"
                                  ? `${rate.value}%`
                                  : formatMoney(rate.value, "TZS")}
                              </td>
                              <td className="px-4 py-3">
                                <DateTimeCell value={rate.effectiveFrom} />
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  className={
                                    rate.isActive
                                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                      : "border-slate-500/40 bg-slate-500/10 text-slate-400"
                                  }
                                >
                                  {rate.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <DateTimeCell value={rate.createdAt} />
                              </td>
                              <td className="px-4 py-3">
                                <RowActionsMenu>
                                  <button
                                    type="button"
                                    className={rowActionItemClass}
                                    onClick={() => startEdit(rate)}
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <Pencil className="h-4 w-4 text-slate-400" />
                                      Edit
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${rowActionItemClass} text-red-300`}
                                    onClick={() => void onDelete(rate)}
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </span>
                                  </button>
                                </RowActionsMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <SlidePanel
          open={panelOpen}
          title={editingId != null ? "Edit provider fee rate" : "Add provider fee rate"}
          onClose={closePanel}
        >
          <p className="mb-4 text-sm text-slate-400">
            Only one active rate is allowed per network and operation. Checking
            Active deactivates any other active rate for that pair.
          </p>

          <form
            onSubmit={(event) => void onSubmit(event)}
            className="space-y-3"
          >
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>Network</span>
              <StaticSearchableSelect
                value={providerNetworkId}
                onChange={setProviderNetworkId}
                options={networkOptions}
                placeholder="Select network"
              />
            </label>
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>Operation</span>
              <StaticSearchableSelect
                value={operation}
                onChange={setOperation}
                options={OPERATION_OPTIONS}
              />
            </label>
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>Type</span>
              <StaticSearchableSelect
                value={commissionType}
                onChange={setCommissionType}
                options={COMMISSION_TYPE_OPTIONS}
              />
            </label>
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>
                Value
                {commissionType === "PERCENT" ? " (%)" : " (TZS)"}
              </span>
              <Input
                type="number"
                min="0"
                step="0.0001"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>Effective from</span>
              <DateInput value={effectiveFrom} onChange={setEffectiveFrom} />
            </label>
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>Notes (optional)</span>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                placeholder="e.g. Oct 2026 MNO schedule"
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-slate-950 px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-500/40"
              />
              <span>
                Active
                <span className="mt-0.5 block text-xs text-slate-500">
                  At most one active rate per network and operation.
                </span>
              </span>
            </label>
            {otherActiveForPair ? (
              <p className="text-sm text-amber-300">
                Another active rate already exists for this network and
                operation
                {otherActiveForPair.commissionType === "PERCENT"
                  ? ` (${otherActiveForPair.value}%)`
                  : ` (${formatMoney(otherActiveForPair.value, "TZS")})`}
                . Saving as Active will deactivate it.
              </p>
            ) : null}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving…"
                  : editingId != null
                    ? "Save changes"
                    : "Add rate"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={closePanel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </SlidePanel>
      </AppShell>
    </AuthGuard>
  );
}
