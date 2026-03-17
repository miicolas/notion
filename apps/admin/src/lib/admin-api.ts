import { apiFetch } from "./api-client";

export type AdminStats = {
  totalUsers: number;
  totalOrgs: number;
  totalProjects: number;
  totalIssues: number;
  totalMembers: number;
  totalSprints: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string;
  banned: boolean | null;
};

export type AdminOrganization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: string;
  memberCount: number;
};

export type ChartDataPoint = {
  month: string;
  count: number;
};

export type StatusDataPoint = {
  status: string;
  count: number;
};

export type PriorityDataPoint = {
  priority: string;
  count: number;
};

export type OrgDataPoint = {
  orgName: string;
  count: number;
};

export function fetchStats() {
  return apiFetch<AdminStats>("/api/admin/stats");
}

export function fetchUsers() {
  return apiFetch<AdminUser[]>("/api/admin/users");
}

export function fetchOrganizations() {
  return apiFetch<AdminOrganization[]>("/api/admin/organizations");
}

export function fetchUsersGrowth() {
  return apiFetch<ChartDataPoint[]>("/api/admin/charts/users-growth");
}

export function fetchIssuesOverTime() {
  return apiFetch<ChartDataPoint[]>("/api/admin/charts/issues-over-time");
}

export function fetchIssuesByStatus() {
  return apiFetch<StatusDataPoint[]>("/api/admin/charts/issues-by-status");
}

export function fetchIssuesByPriority() {
  return apiFetch<PriorityDataPoint[]>("/api/admin/charts/issues-by-priority");
}

export function fetchOrgsActivity() {
  return apiFetch<OrgDataPoint[]>("/api/admin/charts/orgs-activity");
}

export function fetchProjectsPerOrg() {
  return apiFetch<OrgDataPoint[]>("/api/admin/charts/projects-per-org");
}

export function fetchUsersPerOrg() {
  return apiFetch<OrgDataPoint[]>("/api/admin/charts/users-per-org");
}
