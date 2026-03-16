import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// GET /api/teams — list teams for the current org with members
app.get("/", async (c) => {
  const { organizationId } = c.get("auth");

  const teams = await db.query.team.findMany({
    where: eq(schema.team.organizationId, organizationId),
    with: {
      members: {
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
      },
    },
  });

  return c.json(teams);
});

// GET /api/teams/:id — team detail with members
app.get("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const found = await db.query.team.findFirst({
    where: and(
      eq(schema.team.id, id),
      eq(schema.team.organizationId, organizationId),
    ),
    with: {
      members: {
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
      },
    },
  });

  if (!found) return c.json({ error: "Not found" }, 404);
  return c.json(found);
});

export default app;
