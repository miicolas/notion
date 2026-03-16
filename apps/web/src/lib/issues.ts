import { apiFetch } from "./api-client";
import type { Issue } from "./types";

export async function getIssues(params?: {
  projectId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  labelId?: string;
  sprintId?: string;
  teamId?: string;
}): Promise<Issue[]> {
  const search = new URLSearchParams();
  if (params?.projectId) search.set("projectId", params.projectId);
  if (params?.status) search.set("status", params.status);
  if (params?.priority) search.set("priority", params.priority);
  if (params?.assigneeId) search.set("assigneeId", params.assigneeId);
  if (params?.labelId) search.set("labelId", params.labelId);
  if (params?.sprintId) search.set("sprintId", params.sprintId);
  if (params?.teamId) search.set("teamId", params.teamId);
  const qs = search.toString();
  return apiFetch(`/api/issues${qs ? `?${qs}` : ""}`);
}

export async function getIssue(id: string): Promise<Issue> {
  return apiFetch(`/api/issues/${id}`);
}

export async function createIssue(data: {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  deadline?: string;
  labelIds?: string[];
  sprintId?: string;
}): Promise<Issue> {
  return apiFetch("/api/issues", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIssue(data: {
  id: string;
  [key: string]: unknown;
}): Promise<Issue> {
  const { id, ...body } = data;
  return apiFetch(`/api/issues/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function reorderIssue(data: {
  id: string;
  sortOrder: number;
  status?: string;
}): Promise<void> {
  const { id, ...body } = data;
  return apiFetch(`/api/issues/${id}/reorder`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteIssue(id: string): Promise<void> {
  return apiFetch(`/api/issues/${id}`, { method: "DELETE" });
}
