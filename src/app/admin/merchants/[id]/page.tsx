"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CredentialsPanel } from "@/components/merchants/CredentialsPanel";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { statusColor } from "@/lib/format";
import type { MerchantCredentials } from "@/types/api";

export default function MerchantDetailPage() {
  const params = useParams();
  const merchantId = Number(params.id);
  const [credentials, setCredentials] = useState<MerchantCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!merchantId) return;

    apiFetch<MerchantCredentials>(`/admin/v1/merchants/${merchantId}/credentials`)
      .then(setCredentials)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load merchant"))
      .finally(() => setLoading(false));
  }, [merchantId]);

  return (
    <AuthGuard role="admin">
      <AppShell
        role="admin"
        title={credentials?.merchant.name ?? "Merchant details"}
        subtitle="View merchant info and share API or portal credentials"
      >
        <div className="mb-6">
          <Link href="/admin/merchants">
            <Button variant="ghost">← Back to merchants</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading merchant...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : credentials ? (
          <div className="space-y-6">
            <Card className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">{credentials.merchant.name}</div>
                <div className="mt-1 text-sm text-slate-400">{credentials.merchant.email}</div>
                {credentials.merchant.phone ? (
                  <div className="mt-1 text-sm text-slate-500">{credentials.merchant.phone}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColor(credentials.merchant.status)}>
                  {credentials.merchant.status}
                </Badge>
                <Link href={`/admin/merchants/${merchantId}/edit`}>
                  <Button variant="secondary">Edit merchant</Button>
                </Link>
              </div>
            </Card>

            <CredentialsPanel merchantId={merchantId} initial={credentials} />
          </div>
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
