"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageLoader } from "@/components/ui/PageLoader";

/** Merchant dashboard is hidden from nav; keep the route and send users to wallets. */
export default function MerchantDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/merchant/wallets");
  }, [router]);

  return (
    <AuthGuard role="merchant">
      <PageLoader label="Opening wallets…" />
    </AuthGuard>
  );
}
