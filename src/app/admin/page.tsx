"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { PageLoader } from "@/components/ui/PageLoader";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { PortalDashboard } from "@/types/api";

export default function AdminDashboardPage() {
  const user = getUser();
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<PortalDashboard>("/admin/v1/dashboard")
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title={`Welcome, ${user?.name ?? "Admin"}`}
        subtitle="Platform-wide overview across all merchants"
      >
        {loading ? (
          <PageLoader label="Loading dashboard…" />
        ) : (
          <DashboardView
            dashboard={dashboard}
            balanceTitle="Platform balance"
            transactionsHref="/admin/transactions"
            showMerchant
          />
        )}
      </AppShell>
    </AuthGuard>
  );
}
