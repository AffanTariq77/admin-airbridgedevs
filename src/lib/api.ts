import { getToken } from "./auth";

const baseUrl = import.meta.env.VITE_API_URL || "";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || err.message || "Request failed");
  }

  // On static hosting an unknown /api path falls back to index.html, so a 200
  // does not guarantee JSON. Say the endpoint is missing instead of failing
  // with an unreadable "Unexpected token '<'" parse error.
  if (!res.headers.get("content-type")?.includes("application/json")) {
    throw new Error(
      `No API backend is serving ${path}. Set VITE_API_URL to a running API, or use the Supabase-backed pages.`
    );
  }

  return res.json();
}
