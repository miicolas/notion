import { createServerFn } from "@tanstack/react-start"
import { apiFetch } from "./api.server"

export const getLabels = createServerFn({ method: "GET" }).handler(
  async () => apiFetch("/api/labels"),
)

export const createLabel = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; color: string }) => data)
  .handler(async ({ data }) =>
    apiFetch("/api/labels", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  )

export const updateLabel = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; name?: string; color?: string }) => data)
  .handler(async ({ data }) => {
    const { id, ...body } = data
    return apiFetch(`/api/labels/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  })

export const deleteLabel = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) =>
    apiFetch(`/api/labels/${id}`, { method: "DELETE" }),
  )
