"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/PageLoader";
import { getRole, homeForRole } from "@/lib/auth";

export function AuthGuard({
  role,
  children,
}: {
  role: "admin" | "merchant";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const currentRole = getRole();

    if (!currentRole) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (currentRole !== role) {
      router.replace(homeForRole(currentRole));
      return;
    }

    setReady(true);
  }, [role, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <PageLoader label="Preparing portal…" />
      </div>
    );
  }

  return <>{children}</>;
}
