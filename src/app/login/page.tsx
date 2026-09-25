"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { homeForRole, saveSession } from "@/lib/auth";
import Logo from "@/components/Logo";
import type { AuthUser, UserRole } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch<{
        token: string;
        role: UserRole;
        user: AuthUser;
      }>("/v1/portal/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      saveSession(data.token, data.role, data.user);
      router.push(homeForRole(data.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell relative min-h-screen overflow-hidden">
      <div className="login-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-1/4 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-12">
        <section className="mb-10 max-w-xl lg:mb-0">
          <div className="flex items-center gap-3">
            <Logo size={48} gradientId="lhMarkLogin" />
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
                Use your work email to open the merchant or admin dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="login-input w-full rounded-xl px-4 py-2.5 text-sm transition"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-input w-full rounded-xl px-4 py-2.5 pr-11 text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
