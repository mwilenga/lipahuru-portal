"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button, Card, Input } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import type { Merchant } from "@/types/api";

export default function EditMerchantPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    default_callback_url: "",
  });

  useEffect(() => {
    if (!merchantId) return;

    apiFetch<Merchant>(`/admin/v1/merchants/${merchantId}`)
      .then((merchant) => {
        setForm({
          name: merchant.name,
          email: merchant.email,
          phone: merchant.phone ?? "",
          default_callback_url: merchant.defaultCallbackUrl ?? "",
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load merchant"))
      .finally(() => setLoading(false));
  }, [merchantId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiFetch(`/admin/v1/merchants/${merchantId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          default_callback_url: form.default_callback_url || null,
        }),
      });

      router.push(`/admin/merchants/${merchantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update merchant");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGuard role="admin">
      <AppShell role="admin" title="Edit merchant" subtitle="Update merchant profile details">
        <div className="mb-6">
          <Link href={`/admin/merchants/${merchantId}`}>
            <Button variant="ghost">← Back to merchant</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading merchant...</div>
        ) : (
          <Card className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Business name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Default callback URL</label>
                <Input
                  value={form.default_callback_url}
                  onChange={(e) =>
                    setForm({ ...form, default_callback_url: e.target.value })
                  }
                />
              </div>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
                <Link href={`/admin/merchants/${merchantId}`}>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        )}
      </AppShell>
    </AuthGuard>
  );
}
