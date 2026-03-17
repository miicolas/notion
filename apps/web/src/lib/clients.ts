import { apiFetch } from "./api-client";
import type { Client } from "./types";

export async function getClients(): Promise<Array<Client>> {
  return apiFetch("/api/clients");
}

export async function getClient(id: string): Promise<Client> {
  return apiFetch(`/api/clients/${id}`);
}

export async function createClient(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
}): Promise<Client> {
  return apiFetch("/api/clients", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateClient(data: {
  id: string;
  [key: string]: unknown;
}): Promise<Client> {
  const { id, ...body } = data;
  return apiFetch(`/api/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteClient(id: string): Promise<void> {
  return apiFetch(`/api/clients/${id}`, { method: "DELETE" });
}
