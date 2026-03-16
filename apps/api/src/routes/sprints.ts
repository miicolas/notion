import { Hono } from "hono";
import { eq, and, notInArray } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// GET /api/sprints
app.get("/", async (c) => {
  const { organizationId } = c.get("auth");
  const projectId = c.req.query("projectId");

  if (!projectId) {
    return c.json({ error: "projectId is required" }, 400);
  }

  const sprints = await db.query.sprint.findMany({
    where: and(
      eq(schema.sprint.organizationId, organizationId),
      eq(schema.sprint.projectId, projectId),
    ),
    with: {
      issues: {
        columns: { id: true, title: true, status: true, priority: true },
      },
    },
    orderBy: (sprint, { desc }) => [desc(sprint.createdAt)],
  });

  return c.json(sprints);
});

// POST /api/sprints
app.post("/", async (c) => {
  const { organizationId } = c.get("auth");
  const body = await c.req.json();

  const id = crypto.randomUUID();

  const [created] = await db
    .insert(schema.sprint)
    .values({
      id,
      organizationId,
      projectId: body.projectId,
      name: body.name,
      goal: body.goal ?? null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      status: body.status ?? "planned",
    })
    .returning();

  return c.json(created, 201);
});

// GET /api/sprints/:id
app.get("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const found = await db.query.sprint.findFirst({
    where: and(
      eq(schema.sprint.id, id),
      eq(schema.sprint.organizationId, organizationId),
    ),
    with: {
      issues: {
        with: {
          assignee: {
            with: {
              user: { columns: { id: true, name: true, image: true } },
            },
          },
          issueLabels: { with: { label: true } },
        },
        orderBy: (issue, { asc }) => [asc(issue.sortOrder)],
      },
      project: { columns: { id: true, name: true } },
    },
  });

  if (!found) return c.json({ error: "Not found" }, 404);
  return c.json(found);
});

// PATCH /api/sprints/:id
app.patch("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");
  const body = await c.req.json();

  const { name, goal, startDate, endDate, status } = body;

  const sprintUpdate: Record<string, unknown> = {};
  if (name !== undefined) sprintUpdate.name = name;
  if (goal !== undefined) sprintUpdate.goal = goal;
  if (startDate !== undefined) sprintUpdate.startDate = new Date(startDate);
  if (endDate !== undefined) sprintUpdate.endDate = new Date(endDate);
  if (status !== undefined) sprintUpdate.status = status;

  const [updated] = await db
    .update(schema.sprint)
    .set(sprintUpdate)
    .where(
      and(
        eq(schema.sprint.id, id),
        eq(schema.sprint.organizationId, organizationId),
      ),
    )
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// POST /api/sprints/:id/start
app.post("/:id/start", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  // Find the sprint to get its projectId
  const sprintToStart = await db.query.sprint.findFirst({
    where: and(
      eq(schema.sprint.id, id),
      eq(schema.sprint.organizationId, organizationId),
    ),
  });

  if (!sprintToStart) return c.json({ error: "Not found" }, 404);

  // Ensure no other active sprint in the same project
  const activeSprint = await db.query.sprint.findFirst({
    where: and(
      eq(schema.sprint.projectId, sprintToStart.projectId),
      eq(schema.sprint.organizationId, organizationId),
      eq(schema.sprint.status, "active"),
    ),
  });

  if (activeSprint) {
    return c.json(
      { error: "There is already an active sprint in this project" },
      409,
    );
  }

  const [updated] = await db
    .update(schema.sprint)
    .set({ status: "active" })
    .where(
      and(
        eq(schema.sprint.id, id),
        eq(schema.sprint.organizationId, organizationId),
      ),
    )
    .returning();

  return c.json(updated);
});

// POST /api/sprints/:id/complete
app.post("/:id/complete", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(schema.sprint)
      .set({ status: "completed" })
      .where(
        and(
          eq(schema.sprint.id, id),
          eq(schema.sprint.organizationId, organizationId),
        ),
      )
      .returning();

    if (!updated) return null;

    // Move incomplete issues back to backlog (set sprintId to null)
    await tx
      .update(schema.issue)
      .set({ sprintId: null })
      .where(
        and(
          eq(schema.issue.sprintId, id),
          eq(schema.issue.organizationId, organizationId),
          notInArray(schema.issue.status, ["done", "cancelled"]),
        ),
      );

    return updated;
  });

  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json(result);
});

// DELETE /api/sprints/:id
app.delete("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(schema.sprint)
    .where(
      and(
        eq(schema.sprint.id, id),
        eq(schema.sprint.organizationId, organizationId),
      ),
    )
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default app;
