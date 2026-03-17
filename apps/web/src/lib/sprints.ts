import { apiFetch } from "./api-client";
import type { Sprint, SprintComment } from "./types";

export async function getSprints(projectId: string): Promise<Array<Sprint>> {
  return apiFetch(`/api/sprints?projectId=${projectId}`);
}

export async function getSprint(id: string): Promise<Sprint> {
  return apiFetch(`/api/sprints/${id}`);
}

export async function createSprint(data: {
  projectId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  duration?: string;
  ownerId?: string;
  releaseStatus?: string;
}): Promise<Sprint> {
  return apiFetch("/api/sprints", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSprint(data: {
  id: string;
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  ownerId?: string | null;
  releaseStatus?: string | null;
  retrospective?: string;
}): Promise<Sprint> {
  const { id, ...body } = data;
  return apiFetch(`/api/sprints/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function transitionSprint(
  id: string,
  status: string,
  retrospective?: string,
): Promise<Sprint> {
  return apiFetch(`/api/sprints/${id}/transition`, {
    method: "POST",
    body: JSON.stringify({ status, retrospective }),
  });
}

export async function deleteSprint(id: string): Promise<void> {
  return apiFetch(`/api/sprints/${id}`, { method: "DELETE" });
}

export async function updateSprintMembers(
  sprintId: string,
  memberIds: Array<string>,
): Promise<void> {
  return apiFetch(`/api/sprints/${sprintId}/members`, {
    method: "PUT",
    body: JSON.stringify({ memberIds }),
  });
}

// Sprint comments
export async function getSprintComments(
  sprintId: string,
): Promise<Array<SprintComment>> {
  return apiFetch(`/api/sprint-comments?sprintId=${sprintId}`);
}

export async function createSprintComment(data: {
  sprintId: string;
  content: string;
  type?: "update" | "retrospective";
}): Promise<SprintComment> {
  return apiFetch("/api/sprint-comments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSprintComment(
  id: string,
  content: string,
): Promise<SprintComment> {
  return apiFetch(`/api/sprint-comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export async function deleteSprintComment(id: string): Promise<void> {
  return apiFetch(`/api/sprint-comments/${id}`, { method: "DELETE" });
}
