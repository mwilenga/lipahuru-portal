"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Store,
  Wallet,
} from "lucide-react";
import clsx from "clsx";
import type { UserRole } from "@/types/api";
import { clearSession, getUser } from "@/lib/auth";

const adminNav = [
  { href: "/admin/merchants", label: "Merchants", icon: Store },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
];

const merchantNav = [
  { href: "/merchant", label: "Dashboard", icon: LayoutDashboard },
  { href: "/merchant/wallets", label: "My Wallets", icon: Wallet },
  { href: "/merchant/collections", label: "Collections", icon: ArrowDownLeft },
  { href: "/merchant/disbursements", label: "Disbursements", icon: ArrowUpRight },
  { href: "/merchant/transactions", label: "Transactions", icon: CreditCard },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const user = getUser();
  const items = role === "admin" ? adminNav : merchantNav;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[var(--card-border)] bg-[var(--sidebar)]">
      <div className="border-b border-[var(--card-border)] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-sm font-bold text-slate-950">
            LH
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Lipahuru</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Payment Gateway
            </div>
          </div>
        </div>
        <div className="mt-4 inline-flex rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-teal-300">
          {role === "admin" ? "Super Admin" : "Merchant"}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/merchant" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "border border-teal-500/30 bg-teal-500/10 text-teal-200"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--card-border)] px-4 py-4 text-xs text-slate-500">
        <div>v1.0.0</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          All systems active
        </div>
        <div className="mt-3 truncate text-slate-400">{user?.email}</div>
      </div>
    </aside>
  );
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const user = getUser();

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--card-border)] bg-[#0b1220]/90 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-xl border border-[var(--card-border)] bg-slate-950 px-3 py-2 md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/20 text-sm font-semibold text-teal-200">
              {user?.name?.charAt(0) ?? "U"}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-100">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
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
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
