import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// GET /api/projects
app.get("/", async (c) => {
  const { organizationId } = c.get("auth");
  const status = c.req.query("status");
  const clientId = c.req.query("clientId");

  let conditions = [eq(schema.project.organizationId, organizationId)];
  if (status) {
    conditions.push(eq(schema.project.status, status as "active" | "archived"));
  }
  if (clientId) {
    conditions.push(eq(schema.project.clientId, clientId));
  }

  const projects = await db.query.project.findMany({
    where: and(...conditions),
    with: {
      client: { columns: { id: true, name: true } },
      issues: { columns: { id: true } },
    },
    orderBy: (project, { desc }) => [desc(project.createdAt)],
  });

  return c.json(projects);
});

// POST /api/projects
app.post("/", async (c) => {
  const { organizationId } = c.get("auth");
  const body = await c.req.json();

  const id = crypto.randomUUID();
  const [created] = await db
    .insert(schema.project)
    .values({
      id,
      organizationId,
      name: body.name,
      description: body.description,
      clientId: body.clientId,
      status: body.status ?? "active",
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    })
    .returning();

  return c.json(created, 201);
});

// GET /api/projects/:id
app.get("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const found = await db.query.project.findFirst({
    where: and(
      eq(schema.project.id, id),
      eq(schema.project.organizationId, organizationId),
    ),
    with: {
      client: { columns: { id: true, name: true } },
      issues: { columns: { id: true } },
    },
  });

  if (!found) return c.json({ error: "Not found" }, 404);
  return c.json(found);
});

// PATCH /api/projects/:id
app.patch("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, description, clientId, status, startDate, endDate } = body;

  const [updated] = await db
    .update(schema.project)
    .set({
      name,
      description,
      clientId,
      status,
      startDate: startDate ? new Date(startDate) : startDate,
      endDate: endDate ? new Date(endDate) : endDate,
    })
    .where(
      and(
        eq(schema.project.id, id),
        eq(schema.project.organizationId, organizationId),
      ),
    )
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/projects/:id
app.delete("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(schema.project)
    .where(
      and(
        eq(schema.project.id, id),
        eq(schema.project.organizationId, organizationId),
      ),
    )
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default app;
