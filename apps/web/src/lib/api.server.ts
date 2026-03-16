import { getRequest } from "@tanstack/react-start/server"
import { API_URL } from "./api"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch<T = any>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const request = getRequest()
  const cookie = request.headers.get("cookie")
  const headers: Record<string, string> = {}
  if (cookie) headers["cookie"] = cookie
  if (init?.body) headers["Content-Type"] = "application/json"

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message ?? `API error ${res.status}`)
  }
  return res.json()
}
