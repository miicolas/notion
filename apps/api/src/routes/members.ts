import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// GET /api/members — list org members with user info
app.get("/", async (c) => {
  const { organizationId } = c.get("auth");

  const members = await db.query.member.findMany({
    where: eq(schema.member.organizationId, organizationId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return c.json(members);
});

export default app;
