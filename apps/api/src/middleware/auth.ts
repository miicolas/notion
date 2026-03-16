import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "../auth";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { getActiveOrgId } from "../auth/session";

export type AuthContext = {
  userId: string;
  organizationId: string;
  memberId: string;
};

export const authMiddleware = createMiddleware<{
  Variables: { auth: AuthContext };
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const activeOrganizationId = getActiveOrgId(
    session.session as Record<string, unknown>,
  );

  if (!activeOrganizationId) {
    throw new HTTPException(400, { message: "No active organization" });
  }

  const memberRecord = await db.query.member.findFirst({
    where: and(
      eq(schema.member.userId, session.user.id),
      eq(schema.member.organizationId, activeOrganizationId),
    ),
  });

  if (!memberRecord) {
    throw new HTTPException(403, {
      message: "Not a member of this organization",
    });
  }

  c.set("auth", {
    userId: session.user.id,
    organizationId: activeOrganizationId,
    memberId: memberRecord.id,
  });

  await next();
});
