import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "../auth";
import { db } from "../db";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";

export type AdminContext = {
  userId: string;
};

export const adminMiddleware = createMiddleware<{
  Variables: { admin: AdminContext };
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const userRecord = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
  });

  if (!userRecord || userRecord.role !== "admin") {
    throw new HTTPException(403, { message: "Admin access required" });
  }

  c.set("admin", {
    userId: session.user.id,
  });

  await next();
});
