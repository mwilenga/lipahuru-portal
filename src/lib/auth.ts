import type { AuthUser, UserRole } from "@/types/api";

const TOKEN_KEY = "lipahuru_token";
const ROLE_KEY = "lipahuru_role";
const USER_KEY = "lipahuru_user";
const NEXT_PATH_KEY = "lipahuru_next_path";
const APPROVE_TOPUP_KEY = "lipahuru_approve_topup";
const APPROVE_TRANSFER_KEY = "lipahuru_approve_transfer";

export function saveSession(token: string, role: UserRole, user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(ROLE_KEY);
  return role === "admin" || role === "merchant" ? role : null;
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function homeForRole(role: UserRole): string {
  return role === "admin" ? "/admin" : "/merchant";
}

function decodeNextCandidate(raw: string): string {
  let value = raw.trim();
  // Tolerate accidental double-encoding from SMS/email clients.
  for (let i = 0; i < 2; i += 1) {
    if (!(value.startsWith("%2F") || value.startsWith("%2f"))) break;
    try {
      value = decodeURIComponent(value);
    } catch {
      break;
    }
  }
  return value;
}

function stashApproveFromPath(pathWithQuery: string): void {
  try {
    const url = new URL(pathWithQuery, "https://lipahuru.invalid");
    const approve = url.searchParams.get("approve");
    if (!approve) return;
    if (url.pathname.includes("float-topups")) {
      sessionStorage.setItem(APPROVE_TOPUP_KEY, approve);
    } else if (url.pathname.includes("transfers")) {
      sessionStorage.setItem(APPROVE_TRANSFER_KEY, approve);
    }
  } catch {
    // ignore malformed next paths
  }
}

/** Same-origin relative path only (blocks open redirects). */
export function safeNextPath(
  next: string | null | undefined,
  role: UserRole,
): string | null {
  if (!next) return null;
  const value = decodeNextCandidate(next);
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (role === "admin" && value.startsWith("/admin")) return value;
  if (role === "merchant" && value.startsWith("/merchant")) return value;
  return null;
}

export function rememberNextPath(next: string | null | undefined): void {
  if (typeof window === "undefined" || !next) return;
  const value = decodeNextCandidate(next);
  if (!value.startsWith("/") || value.startsWith("//")) return;
  sessionStorage.setItem(NEXT_PATH_KEY, value);
  stashApproveFromPath(value);
}

/**
 * Persist login deep-link (`?next=` and optional sibling `?approve=` when
 * the next value was not fully URL-encoded).
 */
export function rememberLoginDeepLink(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("next");
  if (fromQuery) rememberNextPath(fromQuery);

  const approve = params.get("approve");
  if (!approve) return;

  const next =
    fromQuery ?? sessionStorage.getItem(NEXT_PATH_KEY) ?? "";
  const path = decodeNextCandidate(next).split("?")[0] || "";
  if (path.includes("float-topups")) {
    sessionStorage.setItem(APPROVE_TOPUP_KEY, approve);
  } else if (path.includes("transfers")) {
    sessionStorage.setItem(APPROVE_TRANSFER_KEY, approve);
  }
}

/** Persist ?next= and return a role-safe destination (clears store when used). */
export function consumeNextPath(role: UserRole): string | null {
  if (typeof window === "undefined") return null;
  const fromQuery = new URLSearchParams(window.location.search).get("next");
  if (fromQuery) rememberNextPath(fromQuery);

  const candidate = fromQuery ?? sessionStorage.getItem(NEXT_PATH_KEY);
  const safe = safeNextPath(candidate, role);
  if (safe) {
    stashApproveFromPath(safe);
    sessionStorage.removeItem(NEXT_PATH_KEY);
  }
  return safe;
}

function approveStorageKey(kind: "topup" | "transfer"): string {
  return kind === "topup" ? APPROVE_TOPUP_KEY : APPROVE_TRANSFER_KEY;
}

/** Read approve id from URL or session; keep it until clearApproveIntent(). */
export function captureApproveIntent(
  kind: "topup" | "transfer",
): string | null {
  if (typeof window === "undefined") return null;
  const key = approveStorageKey(kind);
  const fromQuery = new URLSearchParams(window.location.search).get("approve");
  if (fromQuery) {
    sessionStorage.setItem(key, fromQuery);
    return fromQuery;
  }
  return sessionStorage.getItem(key);
}

export function clearApproveIntent(kind: "topup" | "transfer"): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(approveStorageKey(kind));
}
