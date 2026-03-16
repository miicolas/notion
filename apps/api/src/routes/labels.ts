import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// GET /api/labels
app.get("/", async (c) => {
  const { organizationId } = c.get("auth");

  const labels = await db.query.label.findMany({
    where: eq(schema.label.organizationId, organizationId),
    orderBy: (label, { asc }) => [asc(label.name)],
  });

  return c.json(labels);
});

// POST /api/labels
app.post("/", async (c) => {
  const { organizationId } = c.get("auth");
  const body = await c.req.json();

  const id = crypto.randomUUID();
  const [created] = await db
    .insert(schema.label)
    .values({
      id,
      organizationId,
      name: body.name,
      color: body.color,
    })
    .returning();

  return c.json(created, 201);
});

// PATCH /api/labels/:id
app.patch("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, color } = body;

  const [updated] = await db
    .update(schema.label)
    .set({ name, color })
    .where(
      and(
        eq(schema.label.id, id),
        eq(schema.label.organizationId, organizationId),
      ),
    )
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/labels/:id
app.delete("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(schema.label)
    .where(
      and(
        eq(schema.label.id, id),
        eq(schema.label.organizationId, organizationId),
      ),
    )
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default app;
