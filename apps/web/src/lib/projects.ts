import { createServerFn } from "@tanstack/react-start"
import { apiFetch } from "./api.server"

export const getProjects = createServerFn({ method: "GET" }).handler(
  async () => apiFetch("/api/projects"),
)

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => apiFetch(`/api/projects/${id}`))

export const createProject = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      name: string
      description?: string
      clientId?: string
      status?: string
      startDate?: string
      endDate?: string
    }) => data,
  )
  .handler(async ({ data }) =>
    apiFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  )

export const updateProject = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; [key: string]: unknown }) => data)
  .handler(async ({ data }) => {
    const { id, ...body } = data
    return apiFetch(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  })

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) =>
    apiFetch(`/api/projects/${id}`, { method: "DELETE" }),
  )
