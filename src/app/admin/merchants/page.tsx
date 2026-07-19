"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MerchantActionMenu } from "@/components/merchants/MerchantActionMenu";
import { MerchantOnboardPanel } from "@/components/merchants/MerchantOnboardPanel";
import { MerchantSlidePanel } from "@/components/merchants/MerchantSlidePanel";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { DateTimeCell } from "@/components/ui/DateTimeCell";
import { Badge, Button } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { statusColor } from "@/lib/format";
import type { Merchant, Pagination } from "@/types/api";

type PanelTab = "overview" | "credentials" | "commission";

const PER_PAGE = 10;

function AdminMerchantsContent() {
  const searchParams = useSearchParams();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [panelMerchantId, setPanelMerchantId] = useState<number | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("overview");
  const [panelOpen, setPanelOpen] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);

  const loadMerchants = useCallback((pageNum: number) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pageNum),
      perPage: String(PER_PAGE),
    });
    return apiFetch<{ merchants: Merchant[]; pagination: Pagination }>(
      `/admin/v1/merchants?${params.toString()}`,
    )
      .then((data) => {
        setMerchants(data.merchants);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadMerchants(page);
  }, [loadMerchants, page]);

  useEffect(() => {
    const merchantId = searchParams.get("merchantId");
    const tab = searchParams.get("tab") as PanelTab | null;
    if (merchantId) {
      setPanelMerchantId(Number(merchantId));
      setPanelTab(
        tab && ["overview", "credentials", "commission"].includes(tab)
          ? tab
          : "overview",
      );
      setPanelOpen(true);
    }
    if (searchParams.get("onboard") === "1") {
      setOnboardOpen(true);
    }
  }, [searchParams]);

  function openPanel(merchantId: number, tab: PanelTab = "overview") {
    setPanelMerchantId(merchantId);
    setPanelTab(tab);
    setPanelOpen(true);
  }

  async function approveMerchant(merchant: Merchant) {
    await apiFetch(`/admin/v1/merchants/${merchant.id}/approve`, { method: "POST" });
    setMerchants((prev) =>
      prev.map((item) =>
        item.id === merchant.id ? { ...item, status: "ACTIVE" } : item,
      ),
    );
  }

  async function disableMerchant(merchant: Merchant) {
    if (
      !window.confirm(
        `Disable ${merchant.name}? They will not be able to process payments.`,
      )
    ) {
      return;
    }

    await apiFetch(`/admin/v1/merchants/${merchant.id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason: "Disabled by admin" }),
    });
    setMerchants((prev) =>
      prev.map((item) =>
        item.id === merchant.id ? { ...item, status: "SUSPENDED" } : item,
      ),
    );
  }

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title="Merchants"
        subtitle="Onboard and manage merchant accounts"
      >
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            {pagination ? `${pagination.total} merchants` : "Loading..."}
          </div>
          <Button type="button" onClick={() => setOnboardOpen(true)} className="w-full sm:w-auto">
            Onboard merchant
          </Button>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading merchants...</div>
        ) : merchants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-10 text-center text-sm text-slate-500">
            No merchants yet. Onboard your first merchant to get started.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto rounded-2xl border border-[var(--card-border)]">
              <table className="min-w-[720px] w-full text-left text-sm sm:min-w-full">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Merchant</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Environment</th>
                    <th className="px-4 py-3 text-left">Currency</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => (
                    <tr
                      key={merchant.id}
                      className="border-t border-[var(--card-border)] hover:bg-slate-900/40"
                    >
                      <td className="max-w-[14rem] px-4 py-3 text-left align-middle sm:max-w-[18rem]">
                        <button
                          type="button"
                          onClick={() => openPanel(merchant.id, "overview")}
                          className="block w-full whitespace-normal break-words text-left font-medium leading-snug text-white hover:text-teal-300"
                        >
                          {merchant.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-left align-middle text-slate-300">
                        <span className="break-all">{merchant.email}</span>
                      </td>
                      <td className="px-4 py-3 uppercase text-slate-400">
                        {merchant.environment}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {merchant.defaultCurrency}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColor(merchant.status)}>
                          {merchant.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell value={merchant.createdAt} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MerchantActionMenu
                          merchant={merchant}
                          onEdit={() => openPanel(merchant.id, "overview")}
                          onCredentials={() => openPanel(merchant.id, "credentials")}
                          onApprove={() => approveMerchant(merchant)}
                          onDisable={() => disableMerchant(merchant)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar pagination={pagination} onPageChange={setPage} />
          </div>
        )}

        <MerchantSlidePanel
          open={panelOpen}
          merchantId={panelMerchantId}
          initialTab={panelTab}
          onClose={() => setPanelOpen(false)}
          onSaved={() => void loadMerchants(page)}
        />

        <MerchantOnboardPanel
          open={onboardOpen}
          onClose={() => setOnboardOpen(false)}
          onCreated={() => {
            setPage(1);
            void loadMerchants(1);
          }}
        />
      </AppShell>
    </AuthGuard>
  );
}

export default function AdminMerchantsPage() {
  return (
    <Suspense
      fallback={
        <AuthGuard role="admin">
          <AppShell
            role="admin"
            title="Merchants"
            subtitle="Onboard and manage merchant accounts"
          >
            <div className="text-slate-400">Loading merchants...</div>
          </AppShell>
        </AuthGuard>
      }
    >
      <AdminMerchantsContent />
    </Suspense>
  );
}
