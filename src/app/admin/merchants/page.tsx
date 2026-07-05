"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MerchantActionMenu } from "@/components/merchants/MerchantActionMenu";
import { Badge, Button } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { formatRelativeTime, statusColor } from "@/lib/format";
import type { Merchant, Pagination } from "@/types/api";

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMerchants = useCallback(() => {
    setLoading(true);
    return apiFetch<{ merchants: Merchant[]; pagination: Pagination }>("/admin/v1/merchants")
      .then((data) => {
        setMerchants(data.merchants);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  async function approveMerchant(merchant: Merchant) {
    await apiFetch(`/admin/v1/merchants/${merchant.id}/approve`, { method: "POST" });
    setMerchants((prev) =>
      prev.map((item) =>
        item.id === merchant.id ? { ...item, status: "ACTIVE" } : item,
      ),
    );
  }

  async function disableMerchant(merchant: Merchant) {
    if (!window.confirm(`Disable ${merchant.name}? They will not be able to process payments.`)) {
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
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {pagination ? `${pagination.total} merchants` : "Loading..."}
          </div>
          <Link href="/admin/merchants/new">
            <Button>Onboard merchant</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading merchants...</div>
        ) : merchants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-10 text-center text-sm text-slate-500">
            No merchants yet. Onboard your first merchant to get started.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--card-border)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Environment</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr
                    key={merchant.id}
                    className="border-t border-[var(--card-border)] hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/merchants/${merchant.id}`}
                        className="font-medium text-white hover:text-teal-300"
                      >
                        {merchant.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{merchant.email}</td>
                    <td className="px-4 py-3 uppercase text-slate-400">
                      {merchant.environment}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{merchant.defaultCurrency}</td>
                    <td className="px-4 py-3">
                      <Badge className={statusColor(merchant.status)}>{merchant.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatRelativeTime(merchant.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MerchantActionMenu
                        merchant={merchant}
                        onApprove={() => approveMerchant(merchant)}
                        onDisable={() => disableMerchant(merchant)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
