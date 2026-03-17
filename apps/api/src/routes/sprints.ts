import { Hono } from "hono";
import { eq, and, notInArray, inArray } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["planned"],
  planned: ["active", "draft"],
  active: ["in_review"],
  in_review: ["completed", "active"],
};

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
      owner: {
        with: {
          user: { columns: { id: true, name: true, image: true } },
        },
      },
      sprintComments: {
        orderBy: (sc, { desc }) => [desc(sc.createdAt)],
        limit: 3,
        with: {
          author: { columns: { id: true, name: true, image: true } },
        },
      },
      sprintMembers: {
        with: {
          member: {
            with: {
              user: { columns: { id: true, name: true, image: true } },
            },
          },
        },
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
      status: body.status ?? "draft",
      duration: body.duration ?? "2w",
      ownerId: body.ownerId ?? null,
      releaseStatus: body.releaseStatus ?? null,
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
      owner: {
        with: {
          user: { columns: { id: true, name: true, image: true } },
        },
      },
      sprintComments: {
        orderBy: (sc, { desc }) => [desc(sc.createdAt)],
        with: {
          author: { columns: { id: true, name: true, image: true } },
        },
      },
      sprintMembers: {
        with: {
          member: {
            with: {
              user: { columns: { id: true, name: true, image: true } },
            },
          },
        },
      },
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

  const {
    name,
    goal,
    startDate,
    endDate,
    status,
    duration,
    ownerId,
    releaseStatus,
    retrospective,
  } = body;

  const sprintUpdate: Record<string, unknown> = {};
  if (name !== undefined) sprintUpdate.name = name;
  if (goal !== undefined) sprintUpdate.goal = goal;
  if (startDate !== undefined) sprintUpdate.startDate = new Date(startDate);
  if (endDate !== undefined) sprintUpdate.endDate = new Date(endDate);
  if (status !== undefined) sprintUpdate.status = status;
  if (duration !== undefined) sprintUpdate.duration = duration;
  if (ownerId !== undefined) sprintUpdate.ownerId = ownerId;
  if (releaseStatus !== undefined) sprintUpdate.releaseStatus = releaseStatus;
  if (retrospective !== undefined) sprintUpdate.retrospective = retrospective;

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

// POST /api/sprints/:id/transition
app.post("/:id/transition", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");
  const body = await c.req.json();
  const { status: targetStatus, retrospective } = body;

  const sprintToTransition = await db.query.sprint.findFirst({
    where: and(
      eq(schema.sprint.id, id),
      eq(schema.sprint.organizationId, organizationId),
    ),
  });

  if (!sprintToTransition) return c.json({ error: "Not found" }, 404);

  const allowed = VALID_TRANSITIONS[sprintToTransition.status];
  if (!allowed || !allowed.includes(targetStatus)) {
    return c.json(
      {
        error: `Invalid transition from "${sprintToTransition.status}" to "${targetStatus}"`,
      },
      400,
    );
  }

  // Check no other active sprint when transitioning to active
  if (targetStatus === "active") {
    const activeSprint = await db.query.sprint.findFirst({
      where: and(
        eq(schema.sprint.projectId, sprintToTransition.projectId),
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
  }

  // Require retrospective when completing
  if (targetStatus === "completed" && !retrospective) {
    return c.json(
      { error: "Retrospective is required to complete a sprint" },
      400,
    );
  }

  const result = await db.transaction(async (tx) => {
    const updateData: Record<string, unknown> = { status: targetStatus };
    if (retrospective) updateData.retrospective = retrospective;

    const [updated] = await tx
      .update(schema.sprint)
      .set(updateData)
      .where(
        and(
          eq(schema.sprint.id, id),
          eq(schema.sprint.organizationId, organizationId),
        ),
      )
      .returning();

    if (!updated) return null;

    // Move incomplete issues to backlog when completing
    if (targetStatus === "completed") {
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
    }

    return updated;
  });

  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json(result);
});

// PUT /api/sprints/:id/members — sync sprint members
app.put("/:id/members", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");
  const body = await c.req.json();
  const memberIds: string[] = body.memberIds ?? [];

  const sprintExists = await db.query.sprint.findFirst({
    where: and(
      eq(schema.sprint.id, id),
      eq(schema.sprint.organizationId, organizationId),
    ),
    columns: { id: true },
  });

  if (!sprintExists) return c.json({ error: "Not found" }, 404);

  await db.transaction(async (tx) => {
    // Remove all existing members
    await tx
      .delete(schema.sprintMember)
      .where(eq(schema.sprintMember.sprintId, id));

    // Insert new members
    if (memberIds.length > 0) {
      await tx.insert(schema.sprintMember).values(
        memberIds.map((memberId: string) => ({
          sprintId: id,
          memberId,
        })),
      );
    }
  });

  return c.json({ success: true });
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
