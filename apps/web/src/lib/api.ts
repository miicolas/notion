import { getRequest } from "@tanstack/react-start/server"

export const API_URL = process.env.API_URL ?? "http://localhost:3001"

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const request = getRequest()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message ?? `API error ${res.status}`)
  }
  return res.json()
}
