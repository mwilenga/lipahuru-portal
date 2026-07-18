"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Soft redirect: open merchant panel on the list page. */
export default function MerchantDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = Number(params.id);

  useEffect(() => {
    if (!merchantId) {
      router.replace("/admin/merchants");
      return;
    }
    router.replace(`/admin/merchants?merchantId=${merchantId}&tab=credentials`);
  }, [merchantId, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] text-sm text-slate-400">
      Opening merchant...
    </div>
  );
}
