import { createServerFn } from "@tanstack/react-start"
import { apiFetch } from "./api.server"

export const getMembers = createServerFn({ method: "GET" }).handler(
  async () => apiFetch("/api/members"),
)
