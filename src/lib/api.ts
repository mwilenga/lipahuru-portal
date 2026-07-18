import { getToken } from "@/lib/auth";
import type { ApiEnvelope } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();
  let payload: ApiEnvelope<T> | null = null;

  if (raw) {
    try {
      payload = JSON.parse(raw) as ApiEnvelope<T>;
    } catch {
      const preview = raw.trim().slice(0, 80).replace(/\s+/g, " ");
      throw new ApiError(
        response.ok
          ? `Invalid API response (expected JSON). Got: ${preview}`
          : `Request failed (${response.status}). Server returned HTML/non-JSON instead of an API error.`,
        response.status,
      );
    }
  }

  if (!payload) {
    throw new ApiError(
      response.ok ? "Empty API response" : `Request failed (${response.status})`,
      response.status,
    );
  }

  if (!response.ok || payload.status === "FAILED") {
    throw new ApiError(
      payload.message ?? "Request failed",
      response.status,
      payload.code,
    );
  }

  return payload.data;
}
