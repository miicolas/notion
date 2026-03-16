import { createServerFn } from "@tanstack/react-start"
import { apiFetch } from "./api"

export const getMembers = createServerFn({ method: "GET" }).handler(
  async () => apiFetch("/api/members"),
)
