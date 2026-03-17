import { apiFetch } from "./api-client";
import type { Comment } from "./types";

export async function getComments(issueId: string): Promise<Array<Comment>> {
  return apiFetch(`/api/comments?issueId=${issueId}`);
}

export async function createComment(data: {
  issueId: string;
  content: string;
}): Promise<Comment> {
  return apiFetch("/api/comments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateComment(data: {
  id: string;
  content: string;
}): Promise<Comment> {
  const { id, ...body } = data;
  return apiFetch(`/api/comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteComment(id: string): Promise<void> {
  return apiFetch(`/api/comments/${id}`, { method: "DELETE" });
}
