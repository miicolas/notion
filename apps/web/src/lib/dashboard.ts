import { apiFetch } from "./api-client";
import type { DashboardStats } from "./types";

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch("/api/dashboard/stats");
}
