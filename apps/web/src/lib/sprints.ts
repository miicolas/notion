import { apiFetch } from "./api-client";
import type { Sprint } from "./types";

export async function getSprints(projectId: string): Promise<Sprint[]> {
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
}): Promise<Sprint> {
  const { id, ...body } = data;
  return apiFetch(`/api/sprints/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function startSprint(id: string): Promise<Sprint> {
  return apiFetch(`/api/sprints/${id}/start`, { method: "POST" });
}

export async function completeSprint(id: string): Promise<Sprint> {
  return apiFetch(`/api/sprints/${id}/complete`, { method: "POST" });
}

export async function deleteSprint(id: string): Promise<void> {
  return apiFetch(`/api/sprints/${id}`, { method: "DELETE" });
}
