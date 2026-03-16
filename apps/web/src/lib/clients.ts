import { createServerFn } from "@tanstack/react-start"
import { apiFetch } from "./api.server"

export const getClients = createServerFn({ method: "GET" }).handler(
  async () => apiFetch("/api/clients"),
)

export const getClient = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => apiFetch(`/api/clients/${id}`))

export const createClient = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      name: string
      email?: string
      phone?: string
      address?: string
      website?: string
      notes?: string
    }) => data,
  )
  .handler(async ({ data }) =>
    apiFetch("/api/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  )

export const updateClient = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; [key: string]: unknown }) => data)
  .handler(async ({ data }) => {
    const { id, ...body } = data
    return apiFetch(`/api/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  })

export const deleteClient = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) =>
    apiFetch(`/api/clients/${id}`, { method: "DELETE" }),
  )
