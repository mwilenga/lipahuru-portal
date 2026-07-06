"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Store, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { homeForRole, saveSession } from "@/lib/auth";
import type { AuthUser } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"merchant" | "admin">("merchant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "admin") {
        const data = await apiFetch<{
          token: string;
          user: AuthUser;
        }>("/admin/v1/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        saveSession(data.token, "admin", data.user);
        router.push(homeForRole("admin"));
      } else {
        const data = await apiFetch<{
          token: string;
          user: AuthUser;
        }>("/v1/merchant/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        saveSession(data.token, "merchant", data.user);
        router.push(homeForRole("merchant"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = mode === "admin";

  return (
    <div className="login-shell relative min-h-screen overflow-hidden">
      <div className="login-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-1/4 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-12">
        <section className="mb-10 max-w-xl lg:mb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-lg font-bold text-[#1a0a00] shadow-lg shadow-amber-500/25">
              LH
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-white">LipaHuru</div>
              <div className="text-xs uppercase tracking-[0.22em] text-amber-200/70">
                Payment Gateway
              </div>
            </div>
          </div>

          <h1 className="mt-10 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Move money.
            <span className="block bg-gradient-to-r from-amber-300 via-orange-300 to-violet-300 bg-clip-text text-transparent">
              Monitor everything.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            Collections, disbursements and wallet balances across Tanzania&apos;s mobile
            money networks — in one operations console.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {["YAS", "Vodacom", "Halotel", "Airtel"].map((network) => (
              <span
                key={network}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
              >
                {network}
              </span>
            ))}
          </div>

          <p className="mt-12 hidden text-sm text-slate-600 lg:block">
            © 2026 LipaHuru. All rights reserved.
          </p>
        </section>

        <section className="w-full max-w-md lg:shrink-0">
          <div className="login-card rounded-[1.75rem] p-8 sm:p-9">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Sign in</h2>
              <p className="mt-2 text-sm text-slate-400">
                {isAdmin
                  ? "Platform administration access"
                  : "Merchant portal access"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/30 p-1.5">
              <button
                type="button"
                onClick={() => setMode("merchant")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  !isAdmin
                    ? "bg-amber-500/20 text-amber-100 shadow-inner shadow-amber-500/10"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Store className="h-4 w-4" />
                Merchant
              </button>
              <button
                type="button"
                onClick={() => setMode("admin")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isAdmin
                    ? "bg-violet-500/25 text-violet-100 shadow-inner shadow-violet-500/10"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Shield className="h-4 w-4" />
                Super Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={
                    isAdmin ? "admin@lipahuru.test" : "merchant@example.com"
                  }
                  className="login-input w-full rounded-xl px-4 py-2.5 text-sm transition"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login-input w-full rounded-xl px-4 py-2.5 text-sm transition"
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="login-btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Continue to dashboard"}
                {!loading ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <Wallet className="h-3.5 w-3.5 text-amber-500/80" />
              <span>Secured gateway session · HTTPS only</span>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600 lg:hidden">
            © 2026 LipaHuru
          </p>
        </section>
      </div>
    </div>
  );
}
