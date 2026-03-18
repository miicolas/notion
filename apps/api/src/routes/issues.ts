import { Hono } from "hono";
import { eq, and, inArray, sql, isNull } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// GET /api/issues
app.get("/", async (c) => {
  const { organizationId } = c.get("auth");
  const projectId = c.req.query("projectId");
  const status = c.req.query("status");
  const priority = c.req.query("priority");
  const assigneeId = c.req.query("assigneeId");
  const labelId = c.req.query("labelId");
  const sprintId = c.req.query("sprintId");

  let conditions = [eq(schema.issue.organizationId, organizationId)];
  if (projectId) conditions.push(eq(schema.issue.projectId, projectId));
  if (sprintId) {
    if (sprintId === "none") {
      conditions.push(isNull(schema.issue.sprintId));
    } else {
      conditions.push(eq(schema.issue.sprintId, sprintId));
    }
  }
  if (status)
    conditions.push(
      eq(
        schema.issue.status,
        status as
          | "backlog"
          | "todo"
          | "in_progress"
          | "done"
          | "cancelled",
      ),
    );
  if (priority)
    conditions.push(
      eq(
        schema.issue.priority,
        priority as "urgent" | "high" | "medium" | "low" | "no_priority",
      ),
    );
  if (assigneeId) conditions.push(eq(schema.issue.assigneeId, assigneeId));

  // Filter by team: get team members' userIds, resolve to org member IDs, filter issues
  const teamId = c.req.query("teamId");
  if (teamId) {
    const teamMembers = await db.query.teamMember.findMany({
      where: eq(schema.teamMember.teamId, teamId),
    });
    const teamUserIds = teamMembers.map((tm) => tm.userId);
    if (teamUserIds.length > 0) {
      const orgMembers = await db.query.member.findMany({
        where: and(
          eq(schema.member.organizationId, organizationId),
          inArray(schema.member.userId, teamUserIds),
        ),
      });
      const memberIds = orgMembers.map((m) => m.id);
      if (memberIds.length > 0) {
        conditions.push(inArray(schema.issue.assigneeId, memberIds));
      } else {
        return c.json([]);
      }
    } else {
      return c.json([]);
    }
  }

  let issues = await db.query.issue.findMany({
    where: and(...conditions),
    with: {
      assignee: {
        with: {
          user: { columns: { id: true, name: true, image: true } },
        },
      },
      issueLabels: {
        with: { label: true },
      },
      project: { columns: { id: true, name: true } },
      sprint: { columns: { id: true, name: true, status: true } },
    },
    orderBy: (issue, { asc }) => [asc(issue.sortOrder)],
  });

  // Filter by labelId in memory (join table filter)
  if (labelId) {
    issues = issues.filter((i) =>
      i.issueLabels.some((il) => il.labelId === labelId),
    );
  }

  return c.json(issues);
});

// POST /api/issues
app.post("/", async (c) => {
  const { organizationId } = c.get("auth");
  const body = await c.req.json();

  const id = crypto.randomUUID();

  // Get max sortOrder for the project
  const maxResult = await db
    .select({ max: sql<number>`COALESCE(MAX(${schema.issue.sortOrder}), 0)` })
    .from(schema.issue)
    .where(
      and(
        eq(schema.issue.organizationId, organizationId),
        eq(schema.issue.projectId, body.projectId),
      ),
    );
  const nextOrder = (maxResult[0]?.max ?? 0) + 1;

  const [created] = await db
    .insert(schema.issue)
    .values({
      id,
      organizationId,
      projectId: body.projectId,
      assigneeId: body.assigneeId,
      title: body.title,
      description: body.description,
      status: body.status ?? "backlog",
      priority: body.priority ?? "no_priority",
      deadline: body.deadline ? new Date(body.deadline) : null,
      sprintId: body.sprintId ?? null,
      sortOrder: nextOrder,
    })
    .returning();

  // Attach labels
  if (body.labelIds?.length) {
    await db.insert(schema.issueLabel).values(
      body.labelIds.map((labelId: string) => ({
        issueId: id,
        labelId,
      })),
    );
  }

  return c.json(created, 201);
});

// GET /api/issues/:id
app.get("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const found = await db.query.issue.findFirst({
    where: and(
      eq(schema.issue.id, id),
      eq(schema.issue.organizationId, organizationId),
    ),
    with: {
      assignee: {
        with: {
          user: { columns: { id: true, name: true, image: true } },
        },
      },
      issueLabels: { with: { label: true } },
      issueAssets: { with: { asset: true } },
      project: { columns: { id: true, name: true } },
      sprint: { columns: { id: true, name: true, status: true } },
      comments: {
        with: {
          author: { columns: { id: true, name: true, image: true } },
          commentAssets: { with: { asset: true } },
        },
        orderBy: (comment, { asc }) => [asc(comment.createdAt)],
      },
    },
  });

  if (!found) return c.json({ error: "Not found" }, 404);
  return c.json(found);
});

// PATCH /api/issues/:id
app.patch("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");
  const body = await c.req.json();

  const {
    labelIds,
    title,
    description,
    status,
    priority,
    assigneeId,
    deadline,
    sortOrder,
    sprintId,
  } = body;

  const issueUpdate: Record<string, unknown> = {};
  if (title !== undefined) issueUpdate.title = title;
  if (description !== undefined) issueUpdate.description = description;
  if (status !== undefined) issueUpdate.status = status;
  if (priority !== undefined) issueUpdate.priority = priority;
  if (assigneeId !== undefined) issueUpdate.assigneeId = assigneeId;
  if (deadline !== undefined)
    issueUpdate.deadline = deadline ? new Date(deadline) : null;
  if (sortOrder !== undefined) issueUpdate.sortOrder = sortOrder;
  if (sprintId !== undefined) issueUpdate.sprintId = sprintId;

  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(schema.issue)
      .set(issueUpdate)
      .where(
        and(
          eq(schema.issue.id, id),
          eq(schema.issue.organizationId, organizationId),
        ),
      )
      .returning();

    if (!updated) return null;

    if (labelIds !== undefined) {
      await tx
        .delete(schema.issueLabel)
        .where(eq(schema.issueLabel.issueId, id));
      if (labelIds.length) {
        await tx.insert(schema.issueLabel).values(
          labelIds.map((labelId: string) => ({
            issueId: id,
            labelId,
          })),
        );
      }
    }

    return updated;
  });

  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json(result);
});

// PATCH /api/issues/:id/reorder
app.patch("/:id/reorder", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");
  const { sortOrder, status } = await c.req.json();

  const updateData: Record<string, unknown> = { sortOrder };
  if (status) updateData.status = status;

  const [updated] = await db
    .update(schema.issue)
    .set(updateData)
    .where(
      and(
        eq(schema.issue.id, id),
        eq(schema.issue.organizationId, organizationId),
      ),
    )
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/issues/:id
app.delete("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(schema.issue)
    .where(
      and(
        eq(schema.issue.id, id),
        eq(schema.issue.organizationId, organizationId),
      ),
    )
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default app;
