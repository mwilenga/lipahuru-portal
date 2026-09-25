"use client";

import { useEffect, useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { getRole, homeForRole } from "@/lib/auth";

function redirectTo(path: string) {
  window.location.replace(path);
}

export function AuthGuard({
  role,
  children,
}: {
  role: "admin" | "merchant";
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function resolveAuth() {
      if (cancelled) return;

      try {
        const currentRole = getRole();

        if (!currentRole) {
          const next = `${window.location.pathname}${window.location.search}`;
          redirectTo(`/login?next=${encodeURIComponent(next)}`);
          return;
        }

        if (currentRole !== role) {
          redirectTo(homeForRole(currentRole));
          return;
        }

        setReady(true);
      } catch {
        redirectTo("/login");
      }
    }

    resolveAuth();

    // Failsafe: never leave the user on Preparing portal indefinitely.
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      if (!getRole()) {
        const next = `${window.location.pathname}${window.location.search}`;
        redirectTo(`/login?next=${encodeURIComponent(next)}`);
      }
    }, 1500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [role]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <PageLoader label="Preparing portal…" />
      </div>
    );
  }

  return <>{children}</>;
}
