"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Soft redirect: open onboard slide panel on the merchants list. */
export default function NewMerchantRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/merchants?onboard=1");
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] text-sm text-slate-400">
      Opening onboard...
    </div>
  );
}
