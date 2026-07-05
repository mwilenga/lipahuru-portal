"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      router.replace("/login");
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-slate-400">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
