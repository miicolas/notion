import { createServerFn } from "@tanstack/react-start"
import { apiFetch } from "./api"

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
    const url = new URL("/api/issues", "http://localhost")
    if (params?.projectId) url.searchParams.set("projectId", params.projectId)
    if (params?.status) url.searchParams.set("status", params.status)
    if (params?.priority) url.searchParams.set("priority", params.priority)
    if (params?.assigneeId) url.searchParams.set("assigneeId", params.assigneeId)
    if (params?.labelId) url.searchParams.set("labelId", params.labelId)
    return apiFetch(`/api/issues${url.search}`)
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
