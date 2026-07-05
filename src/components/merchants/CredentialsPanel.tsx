"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import type { MerchantCredentials } from "@/types/api";

function CredentialField({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
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
        <div
          className={`min-w-0 flex-1 break-all rounded-lg bg-slate-950 p-3 text-sm text-teal-200 ${
            mono ? "font-mono" : ""
          }`}
        >
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

function RevealedSecret({
  title,
  fields,
  onDismiss,
}: {
  title: string;
  fields: Record<string, string>;
  onDismiss: () => void;
}) {
  return (
    <Card className="space-y-4 border-amber-500/30 bg-amber-500/5">
      <h3 className="text-lg font-semibold text-amber-200">{title}</h3>
      <p className="text-sm text-amber-100/80">
        Copy and share these credentials now. They will not be shown again.
      </p>
      {Object.entries(fields).map(([key, value]) => (
        <CredentialField key={key} label={key} value={value} />
      ))}
      <Button variant="secondary" onClick={onDismiss}>
        I have saved these credentials
      </Button>
    </Card>
  );
}

export function CredentialsPanel({
  merchantId,
  initial,
}: {
  merchantId: number;
  initial: MerchantCredentials;
}) {
  const [credentials, setCredentials] = useState(initial);
  const [revealed, setRevealed] = useState<Record<string, string> | null>(null);
  const [revealedTitle, setRevealedTitle] = useState("");
  const [loading, setLoading] = useState<"api" | "portal" | null>(null);
  const [error, setError] = useState("");

  async function regenerateApiSecret() {
    if (
      !window.confirm(
        "Regenerating will invalidate the current client secret. The merchant must update their integration. Continue?",
      )
    ) {
      return;
    }

    setLoading("api");
    setError("");

    try {
      const data = await apiFetch<{ clientId: string; clientSecret: string }>(
        `/admin/v1/merchants/${merchantId}/rotate-credentials`,
        { method: "POST" },
      );

      setRevealed({
        clientId: data.clientId,
        clientSecret: data.clientSecret,
      });
      setRevealedTitle("New API credentials");
      setCredentials((prev) => ({
        ...prev,
        clientId: data.clientId,
        clientStatus: "ACTIVE",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate API secret");
    } finally {
      setLoading(null);
    }
  }

  async function resetPortalPassword() {
    if (
      !window.confirm(
        "This will reset the merchant portal password. Share the new password with the merchant. Continue?",
      )
    ) {
      return;
    }

    setLoading("portal");
    setError("");

    try {
      const data = await apiFetch<{ portalEmail: string; portalPassword: string }>(
        `/admin/v1/merchants/${merchantId}/reset-portal-password`,
        { method: "POST" },
      );

      setRevealed({
        portalEmail: data.portalEmail,
        portalPassword: data.portalPassword,
      });
      setRevealedTitle("New portal login");
      setCredentials((prev) => ({
        ...prev,
        portalEmail: data.portalEmail,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset portal password");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {revealed ? (
        <RevealedSecret
          title={revealedTitle}
          fields={revealed}
          onDismiss={() => setRevealed(null)}
        />
      ) : null}

      <Card className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white">API credentials</h3>
          <p className="mt-1 text-sm text-slate-400">
            Share these with the merchant for server-to-server integration.
          </p>
        </div>

        {credentials.clientId ? (
          <CredentialField label="Client ID" value={credentials.clientId} />
        ) : (
          <p className="text-sm text-slate-500">No API client found for this merchant.</p>
        )}

        <div className="rounded-lg border border-dashed border-[var(--card-border)] bg-slate-950/50 p-4">
          <div className="text-sm font-medium text-slate-200">Client secret</div>
          <p className="mt-1 text-sm text-slate-400">{credentials.clientSecretHint}</p>
          <Button
            className="mt-3"
            variant="secondary"
            disabled={loading !== null}
            onClick={regenerateApiSecret}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {loading === "api" ? "Regenerating..." : "Regenerate API secret"}
          </Button>
        </div>

        {credentials.clientStatus ? (
          <div className="text-xs text-slate-500">
            API client status: {credentials.clientStatus}
          </div>
        ) : null}
      </Card>

      <Card className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Portal login</h3>
          <p className="mt-1 text-sm text-slate-400">
            Merchant can sign in to the portal with this email and password.
          </p>
        </div>

        {credentials.portalEmail ? (
          <CredentialField label="Portal email" value={credentials.portalEmail} mono={false} />
        ) : null}

        <div className="rounded-lg border border-dashed border-[var(--card-border)] bg-slate-950/50 p-4">
          <div className="text-sm font-medium text-slate-200">Portal password</div>
          <p className="mt-1 text-sm text-slate-400">
            Password is only shown once at creation or after a reset.
          </p>
          <Button
            className="mt-3"
            variant="secondary"
            disabled={loading !== null}
            onClick={resetPortalPassword}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {loading === "portal" ? "Resetting..." : "Reset portal password"}
          </Button>
        </div>
      </Card>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
