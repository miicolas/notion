import { API_URL } from "./api";

export async function apiFetch<T = any>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (init?.body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `API error ${res.status}`);
  }
  return res.json();
}
