"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { PageLoader } from "@/components/ui/PageLoader";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { PortalDashboard } from "@/types/api";

export default function MerchantDashboardPage() {
  const user = getUser();
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<PortalDashboard>("/v1/portal/dashboard")
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard role="merchant">
      <AppShell
        role="merchant"
        title={`Welcome, ${user?.name ?? "Merchant"}`}
        subtitle="Overview of your wallets, collections and disbursements"
      >
        {loading ? (
          <PageLoader label="Loading dashboard…" />
        ) : (
          <DashboardView
            dashboard={dashboard}
            balanceTitle="Parent wallet"
            transactionsHref="/merchant/collections"
          />
        )}
      </AppShell>
    </AuthGuard>
  );
}
