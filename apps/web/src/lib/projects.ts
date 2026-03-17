import { apiFetch } from "./api-client";
import type { Project } from "./types";

export async function getProjects(): Promise<Array<Project>> {
  return apiFetch("/api/projects");
}

export async function getProject(id: string): Promise<Project> {
  return apiFetch(`/api/projects/${id}`);
}

export async function createProject(data: {
  name: string;
  description?: string;
  clientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Project> {
  return apiFetch("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProject(data: {
  id: string;
  [key: string]: unknown;
}): Promise<Project> {
  const { id, ...body } = data;
  return apiFetch(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteProject(id: string): Promise<void> {
  return apiFetch(`/api/projects/${id}`, { method: "DELETE" });
}
