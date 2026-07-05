"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { statusColor } from "@/lib/format";
import type { Merchant, Pagination } from "@/types/api";

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ merchants: Merchant[]; pagination: Pagination }>("/admin/v1/merchants")
      .then((data) => {
        setMerchants(data.merchants);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, []);

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
        ) : (
          <div className="grid gap-4">
            {merchants.map((merchant) => (
              <Card key={merchant.id} className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-medium text-white">{merchant.name}</div>
                  <div className="mt-1 text-sm text-slate-400">{merchant.email}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {merchant.environment.toUpperCase()} · {merchant.defaultCurrency}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                {merchant.status === "PENDING" ? (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await apiFetch(`/admin/v1/merchants/${merchant.id}/approve`, {
                        method: "POST",
                      });
                      setMerchants((prev) =>
                        prev.map((m) =>
                          m.id === merchant.id ? { ...m, status: "ACTIVE" } : m,
                        ),
                      );
                    }}
                  >
                    Approve
                  </Button>
                ) : null}
                <Badge className={statusColor(merchant.status)}>{merchant.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
