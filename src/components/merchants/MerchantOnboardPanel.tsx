"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { Button, Input } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { copyText } from "@/lib/clipboard";

function CredentialField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 flex items-start gap-2">
        <div className="min-w-0 flex-1 break-all rounded-lg bg-slate-950 p-3 font-mono text-sm text-teal-200">
          {value}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-[var(--card-border)] p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
          title="Copy"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      {copied ? <div className="mt-1 text-xs text-emerald-400">Copied</div> : null}
    </div>
  );
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  default_callback_url: "",
  owner_password: "",
};

export function MerchantOnboardPanel({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string> | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setCredentials(null);
      setError("");
      setLoading(false);
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        owner_password: form.owner_password || undefined,
        default_callback_url: form.default_callback_url || undefined,
        phone: form.phone || undefined,
      };

      const data = await apiFetch<{
        clientId: string;
        clientSecret: string;
        portalEmail: string;
        portalPassword: string;
      }>("/admin/v1/merchants", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCredentials({
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        portalEmail: data.portalEmail,
        portalPassword: data.portalPassword,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create merchant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SlidePanel
      open={open}
      title={credentials ? "Merchant created" : "Onboard merchant"}
      onClose={onClose}
      panelClassName="max-w-none md:w-1/2"
    >
      {credentials ? (
        <div className="space-y-4">
          <p className="text-sm text-emerald-300">
            Store these credentials now — secrets will not be shown again.
          </p>
          {Object.entries(credentials).map(([key, value]) => (
            <CredentialField key={key} label={key} value={value} />
          ))}
          <Button onClick={onClose}>Done</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">Business name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">
              Default callback URL
            </label>
            <Input
              value={form.default_callback_url}
              onChange={(e) =>
                setForm({ ...form, default_callback_url: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">
              Portal password (optional — auto-generated if empty)
            </label>
            <Input
              type="text"
              value={form.owner_password}
              onChange={(e) => setForm({ ...form, owner_password: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create merchant"}
          </Button>
        </form>
      )}
    </SlidePanel>
  );
}
