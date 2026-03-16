import { apiFetch } from "./api-client";
import type { Team } from "./types";

export async function getTeams(): Promise<Team[]> {
  return apiFetch("/api/teams");
}

export async function getTeam(id: string): Promise<Team> {
  return apiFetch(`/api/teams/${id}`);
}

export async function createTeam(data: { name: string }): Promise<unknown> {
  return apiFetch("/api/auth/organization/create-team", {
    method: "POST",
    body: JSON.stringify({ name: data.name }),
  });
}

export async function deleteTeam(id: string): Promise<unknown> {
  return apiFetch("/api/auth/organization/delete-team", {
    method: "POST",
    body: JSON.stringify({ teamId: id }),
  });
}

export async function addTeamMember(data: {
  teamId: string;
  userId: string;
}): Promise<unknown> {
  return apiFetch("/api/auth/organization/add-team-member", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function removeTeamMember(data: {
  teamId: string;
  userId: string;
}): Promise<unknown> {
  return apiFetch("/api/auth/organization/remove-team-member", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
