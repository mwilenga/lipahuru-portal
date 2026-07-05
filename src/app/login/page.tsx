"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { homeForRole, saveSession } from "@/lib/auth";
import { Button, Input } from "@/components/ui/primitives";
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

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-teal-950 via-slate-950 to-slate-900 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
            Lipahuru
          </div>
          <h1 className="mt-8 max-w-lg text-4xl font-semibold leading-tight text-white">
            The operations console for Lipahuru Payment Gateway.
          </h1>
          <p className="mt-4 max-w-lg text-slate-400">
            Manage merchants, wallets, collections and disbursements across YAS,
            Vodacom, Halotel and Airtel.
          </p>
        </div>
        <p className="relative text-sm text-slate-500">© 2026 Lipahuru. All rights reserved.</p>
      </section>

      <section className="flex items-center justify-center bg-[var(--background)] p-6">
        <div className="w-full max-w-md rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white">Sign in</h2>
          <p className="mt-2 text-sm text-slate-400">
            Use your Lipahuru gateway credentials to continue.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setMode("merchant")}
              className={`rounded-lg px-3 py-2 text-sm ${
                mode === "merchant"
                  ? "bg-teal-500/20 text-teal-200"
                  : "text-slate-400"
              }`}
            >
              Merchant
            </button>
            <button
              type="button"
              onClick={() => setMode("admin")}
              className={`rounded-lg px-3 py-2 text-sm ${
                mode === "admin"
                  ? "bg-teal-500/20 text-teal-200"
                  : "text-slate-400"
              }`}
            >
              Super Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={mode === "admin" ? "admin@lipahuru.test" : "merchant@example.com"}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Continue"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
