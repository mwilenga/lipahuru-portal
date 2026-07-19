"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  Wallet,
  X,
} from "lucide-react";
import clsx from "clsx";
import type { UserRole } from "@/types/api";
import { clearSession, getUser } from "@/lib/auth";
import { confirmLogout } from "@/lib/confirm";

const HEADER_ROW = "flex h-[4.5rem] shrink-0 items-center overflow-hidden px-4 md:px-6";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/merchants", label: "Merchants", icon: Store },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
];

const merchantNav = [
  { href: "/merchant", label: "Dashboard", icon: LayoutDashboard },
  { href: "/merchant/wallets", label: "My Wallets", icon: Wallet },
  { href: "/merchant/collections", label: "Collections", icon: ArrowDownLeft },
  { href: "/merchant/disbursements", label: "Disbursements", icon: ArrowUpRight },
];

function SidebarBrand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-sm font-bold text-slate-950">
        LH
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">LipaHuru</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">
          Payment Gateway
        </div>
      </div>
    </div>
  );
}

function SidebarNav({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const user = getUser();
  const items = role === "admin" ? adminNav : merchantNav;

  return (
    <>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/merchant" &&
              item.href !== "/admin" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "border border-teal-500/30 bg-teal-500/10 text-teal-200"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-[var(--card-border)] px-4 py-4 text-xs text-slate-500">
        <div>v1.0.0</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          All systems active
        </div>
        <div className="mt-3 inline-flex rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-teal-300">
          {role === "admin" ? "Super Admin" : "Merchant"}
        </div>
        <div className="mt-3 truncate text-slate-400">{user?.email}</div>
      </div>
    </>
  );
}

export function TopBar({
  title,
  subtitle,
  onMenuClick,
}: {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}) {
  const user = getUser();

  return (
    <header className="shrink-0 border-b border-[var(--card-border)] bg-[#0b1220]/95 backdrop-blur">
      <div className={clsx(HEADER_ROW, "justify-between gap-3")}>
        <div className="flex min-w-0 items-center gap-2">
          {onMenuClick ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="shrink-0 rounded-xl border border-[var(--card-border)] p-2 text-slate-300 hover:bg-slate-900 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white sm:text-xl md:text-2xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-slate-400 sm:text-sm">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-3 rounded-xl border border-[var(--card-border)] bg-slate-950 px-3 py-2 lg:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/20 text-sm font-semibold text-teal-200">
              {user?.name?.charAt(0) ?? "U"}
            </div>
            <div className="min-w-0 text-left">
              <div className="truncate text-sm font-medium text-slate-100">{user?.name}</div>
              <div className="truncate text-xs text-slate-500">{user?.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const confirmed = await confirmLogout();
              if (!confirmed) return;

              clearSession();
              window.location.href = "/login";
            }}
            className="rounded-xl border border-[var(--card-border)] p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  role,
  title,
  subtitle,
  children,
}: {
  role: UserRole;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-[var(--background)]">
      {/* Desktop sidebar */}
      <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-[var(--card-border)] bg-[var(--sidebar)] md:flex">
        <div className={clsx(HEADER_ROW, "border-b border-[var(--card-border)]")}>
          <SidebarBrand />
        </div>
        <SidebarNav role={role} />
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-950/70"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-[min(18rem,88vw)] flex-col overflow-hidden border-r border-[var(--card-border)] bg-[var(--sidebar)] shadow-2xl">
            <div
              className={clsx(
                HEADER_ROW,
                "justify-between border-b border-[var(--card-border)]",
              )}
            >
              <SidebarBrand />
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav role={role} onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
