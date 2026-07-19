"use client";

import { useCallback, useEffect, useState } from "react";
import { CredentialsPanel } from "@/components/merchants/CredentialsPanel";
import { PanelTabHeader, PanelTabs } from "@/components/ui/PanelTabs";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { StaticSearchableSelect } from "@/components/ui/StaticSearchableSelect";
import { Button, Input } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import {
  COMMISSION_TYPE_OPTIONS,
  ENVIRONMENT_OPTIONS,
} from "@/lib/select-options";
import type { Merchant, MerchantCommission, MerchantCredentials } from "@/types/api";

type MerchantTab = "overview" | "credentials" | "commission";

const defaultCommissions: MerchantCommission[] = [
  { operation: "C2B_USSD_PUSH", commissionType: "PERCENT", value: "0.0000" },
  { operation: "B2C_DISBURSEMENT", commissionType: "PERCENT", value: "0.0000" },
];

export function MerchantSlidePanel({
  open,
  merchantId,
  initialTab = "overview",
  onClose,
  onSaved,
}: {
  open: boolean;
  merchantId: number | null;
  initialTab?: MerchantTab;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<MerchantTab>(initialTab);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [credentials, setCredentials] = useState<MerchantCredentials | null>(null);
  const [commissions, setCommissions] = useState<MerchantCommission[]>(defaultCommissions);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    defaultCallbackUrl: "",
    environment: "uat",
  });

  const load = useCallback(async (id: number) => {
    setLoading(true);
    setError("");
    setMerchant(null);
    setCredentials(null);
    setCommissions(defaultCommissions);

    try {
      const [merchantResult, credentialsResult, commissionsResult] =
        await Promise.allSettled([
          apiFetch<Merchant>(`/admin/v1/merchants/${id}`),
          apiFetch<MerchantCredentials>(`/admin/v1/merchants/${id}/credentials`),
          apiFetch<{ commissions: MerchantCommission[] }>(
            `/admin/v1/merchants/${id}/commissions`,
          ),
        ]);

      if (merchantResult.status === "rejected") {
        throw merchantResult.reason instanceof Error
          ? merchantResult.reason
          : new Error("Failed to load merchant");
      }

      if (credentialsResult.status === "rejected") {
        throw credentialsResult.reason instanceof Error
          ? credentialsResult.reason
          : new Error("Failed to load credentials");
      }

      const merchantData = merchantResult.value;
      const credentialsData = credentialsResult.value;

      setMerchant(merchantData);
      setCredentials(credentialsData);
      setForm({
        name: merchantData.name ?? "",
        email: merchantData.email ?? "",
        phone: merchantData.phone ?? "",
        defaultCallbackUrl: merchantData.defaultCallbackUrl ?? "",
        environment: merchantData.environment ?? "uat",
      });

      if (commissionsResult.status === "fulfilled") {
        setCommissions(
          defaultCommissions.map(
            (def) =>
              commissionsResult.value.commissions.find(
                (row) => row.operation === def.operation,
              ) ?? def,
          ),
        );
      } else {
        setCommissions(defaultCommissions);
        const commissionError =
          commissionsResult.reason instanceof Error
            ? commissionsResult.reason.message
            : "Commission settings unavailable";
        setError(
          `Overview and credentials loaded. Commission settings could not be loaded: ${commissionError}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load merchant");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && merchantId !== null) {
      setTab(initialTab);
      void load(merchantId);
    }
  }, [open, merchantId, initialTab, load]);

  async function saveOverview() {
    if (merchantId === null) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/admin/v1/merchants/${merchantId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          default_callback_url: form.defaultCallbackUrl || null,
          environment: form.environment,
        }),
      });
      onSaved();
      await load(merchantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save merchant");
    } finally {
      setSaving(false);
    }
  }

  async function saveCommissions() {
    if (merchantId === null) return;
    setSaving(true);
    setError("");
    try {
      const data = await apiFetch<{ commissions: MerchantCommission[] }>(
        `/admin/v1/merchants/${merchantId}/commissions`,
        {
          method: "PUT",
          body: JSON.stringify({ commissions }),
        },
      );
      setCommissions(data.commissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save commissions");
    } finally {
      setSaving(false);
    }
  }

  function updateCommission(
    operation: MerchantCommission["operation"],
    patch: Partial<MerchantCommission>,
  ) {
    setCommissions((prev) =>
      prev.map((row) => (row.operation === operation ? { ...row, ...patch } : row)),
    );
  }

  const title = merchant?.name ?? "Merchant";

  return (
    <SlidePanel
      open={open}
      title={title}
      onClose={onClose}
      panelClassName="w-full max-w-none md:w-1/2"
    >
      {loading ? (
        <p className="text-sm text-slate-400">Loading merchant...</p>
      ) : (
        <div className="space-y-4">
          <PanelTabHeader subtitle={merchant?.email}>
            <PanelTabs
              activeTab={tab}
              onTabChange={setTab}
              tabs={[
                { key: "overview", label: "Overview" },
                { key: "credentials", label: "API credentials" },
                { key: "commission", label: "Commission settings" },
              ]}
            />
          </PanelTabHeader>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          {tab === "overview" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">
                  Default callback URL
                </label>
                <Input
                  value={form.defaultCallbackUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, defaultCallbackUrl: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Environment</label>
                <StaticSearchableSelect
                  value={form.environment}
                  onChange={(value) => setForm((f) => ({ ...f, environment: value }))}
                  options={ENVIRONMENT_OPTIONS}
                  placeholder="Select environment"
                />
              </div>
              <div className="rounded-xl border border-[var(--card-border)] bg-slate-950 p-3 text-sm text-slate-400">
                Status:{" "}
                <span className="font-medium text-slate-200">{merchant?.status}</span>
              </div>
              <Button disabled={saving} onClick={() => void saveOverview()}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          ) : null}

          {tab === "credentials" && merchantId !== null && credentials ? (
            <CredentialsPanel
              key={merchantId}
              merchantId={merchantId}
              initial={credentials}
            />
          ) : null}

          {tab === "commission" ? (
            <div className="space-y-5">
              {commissions.map((row) => (
                <div
                  key={row.operation}
                  className="space-y-3 rounded-xl border border-[var(--card-border)] bg-slate-950 p-4"
                >
                  <div className="text-sm font-medium text-white">
                    {row.operation === "C2B_USSD_PUSH"
                      ? "Collection (C2B)"
                      : "Disbursement (B2C)"}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-500">
                      Commission type
                    </label>
                    <StaticSearchableSelect
                      value={row.commissionType}
                      onChange={(value) =>
                        updateCommission(row.operation, {
                          commissionType: value as MerchantCommission["commissionType"],
                        })
                      }
                      options={COMMISSION_TYPE_OPTIONS}
                      placeholder="Select type"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-500">
                      Value {row.commissionType === "PERCENT" ? "(%)" : "(TZS)"}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={row.value}
                      onChange={(e) =>
                        updateCommission(row.operation, { value: e.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
              <Button disabled={saving} onClick={() => void saveCommissions()}>
                {saving ? "Saving..." : "Save commission settings"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </SlidePanel>
  );
}
