import { createServerFn } from "@tanstack/react-start"
import { apiFetch } from "./api.server"

export const getIssues = createServerFn({ method: "GET" })
  .inputValidator(
    (params?: {
      projectId?: string
      status?: string
      priority?: string
      assigneeId?: string
      labelId?: string
    }) => params,
  )
  .handler(async ({ data: params }) => {
    const search = new URLSearchParams()
    if (params?.projectId) search.set("projectId", params.projectId)
    if (params?.status) search.set("status", params.status)
    if (params?.priority) search.set("priority", params.priority)
    if (params?.assigneeId) search.set("assigneeId", params.assigneeId)
    if (params?.labelId) search.set("labelId", params.labelId)
    const qs = search.toString()
    return apiFetch(`/api/issues${qs ? `?${qs}` : ""}`)
  })

export const getIssue = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => apiFetch(`/api/issues/${id}`))

export const createIssue = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      projectId: string
      title: string
      description?: string
      status?: string
      priority?: string
      assigneeId?: string
      deadline?: string
      labelIds?: string[]
    }) => data,
  )
  .handler(async ({ data }) =>
    apiFetch("/api/issues", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  )

export const updateIssue = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; [key: string]: unknown }) => data)
  .handler(async ({ data }) => {
    const { id, ...body } = data
    return apiFetch(`/api/issues/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  })

export const reorderIssue = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; sortOrder: number; status?: string }) => data)
  .handler(async ({ data }) => {
    const { id, ...body } = data
    return apiFetch(`/api/issues/${id}/reorder`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  })

export const deleteIssue = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) =>
    apiFetch(`/api/issues/${id}`, { method: "DELETE" }),
  )
