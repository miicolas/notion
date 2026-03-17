import { useQuery } from "@tanstack/react-query";
import type { FullOrganization, OrgMember } from "@/lib/types";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";

export function useActiveMember() {
  const { user, activeOrganization } = useAuth();

  const { data: fullOrg, ...query } = useQuery({
    queryKey: ["fullOrganization", activeOrganization?.id],
    queryFn: async () => {
      const { data } = await authClient.organization.getFullOrganization();
      return data as FullOrganization | null;
    },
    enabled: !!activeOrganization,
  });

  const currentMember = fullOrg?.members.find(
    (m: OrgMember) => m.userId === user?.id,
  );

  const role = currentMember?.role ?? "member";
  const isOwner = role === "owner";
  const isAdmin = role === "admin" || isOwner;
  const canManage = isAdmin;

  return {
    fullOrg,
    currentMember,
    role,
    memberId: currentMember?.id ?? null,
    isOwner,
    isAdmin,
    canManage,
    ...query,
  };
}
