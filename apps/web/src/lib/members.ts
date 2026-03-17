import { apiFetch } from "./api-client";
import type { Member } from "./types";

export async function getMembers(): Promise<Array<Member>> {
  return apiFetch("/api/members");
}
