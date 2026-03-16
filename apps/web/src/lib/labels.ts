import { apiFetch } from "./api-client";
import type { LabelItem } from "./types";

export async function getLabels(): Promise<LabelItem[]> {
  return apiFetch("/api/labels");
}

export async function createLabel(data: {
  name: string;
  color: string;
}): Promise<LabelItem> {
  return apiFetch("/api/labels", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLabel(data: {
  id: string;
  name?: string;
  color?: string;
}): Promise<LabelItem> {
  const { id, ...body } = data;
  return apiFetch(`/api/labels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteLabel(id: string): Promise<void> {
  return apiFetch(`/api/labels/${id}`, { method: "DELETE" });
}
