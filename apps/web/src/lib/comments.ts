import { createServerFn } from "@tanstack/react-start"
import { apiFetch } from "./api"

export const getComments = createServerFn({ method: "GET" })
  .inputValidator((issueId: string) => issueId)
  .handler(async ({ data: issueId }) =>
    apiFetch(`/api/comments?issueId=${issueId}`),
  )

export const createComment = createServerFn({ method: "POST" })
  .inputValidator((data: { issueId: string; content: string }) => data)
  .handler(async ({ data }) =>
    apiFetch("/api/comments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  )

export const updateComment = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; content: string }) => data)
  .handler(async ({ data }) => {
    const { id, ...body } = data
    return apiFetch(`/api/comments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  })

export const deleteComment = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) =>
    apiFetch(`/api/comments/${id}`, { method: "DELETE" }),
  )
