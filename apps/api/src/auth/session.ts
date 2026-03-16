/** Extract activeOrganizationId from a Better Auth session object */
export function getActiveOrgId(
  session: Record<string, unknown>,
): string | null {
  return (session as { activeOrganizationId?: string | null })
    .activeOrganizationId ?? null;
}
