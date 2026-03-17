import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Hono } from "hono";
import { db } from "./db";
import { eq } from "drizzle-orm";
import * as schema from "./db/schema";
import { auth } from "./auth";
import sprintsRoutes from "./routes/sprints";
import sprintCommentsRoutes from "./routes/sprint-comments";

const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;

/**
 * E2E tests for the sprint system enhancements.
 * Tests the full sprint lifecycle through the Hono router.
 */
describe("sprints e2e", () => {
  let testUtils: Awaited<typeof auth.$context>["test"];
  let userId: string;
  let organizationId: string;
  let memberId: string;
  let projectId: string;
  let authHeaders: Headers;

  // Build a minimal Hono app with the routes we want to test
  const app = new Hono();
  app.route("/api/sprints", sprintsRoutes);
  app.route("/api/sprint-comments", sprintCommentsRoutes);

  async function apiRequest(
    path: string,
    options: { method?: string; body?: unknown } = {},
  ) {
    const reqHeaders = new Headers(authHeaders);
    reqHeaders.set("Content-Type", "application/json");

    const res = await app.request(path, {
      method: options.method ?? "GET",
      headers: reqHeaders,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    return { status: res.status, data };
  }

  beforeAll(async () => {
    const ctx = await auth.$context;
    testUtils = ctx.test;

    // Create user
    const email = uniqueEmail("sprint-test");
    const user = testUtils.createUser({ email, name: "Sprint Test User" });
    const saved = await testUtils.saveUser(user);
    userId = saved.id;

    // Create organization
    const orgId = crypto.randomUUID();
    await db.insert(schema.organization).values({
      id: orgId,
      name: "Sprint Test Org",
      slug: `sprint-test-${Date.now()}`,
      createdAt: new Date(),
    });
    organizationId = orgId;

    // Create member
    const mId = crypto.randomUUID();
    await db.insert(schema.member).values({
      id: mId,
      organizationId,
      userId,
      role: "owner",
      createdAt: new Date(),
    });
    memberId = mId;

    // Create project
    const pId = crypto.randomUUID();
    await db.insert(schema.project).values({
      id: pId,
      organizationId,
      name: "Sprint Test Project",
      status: "active",
    });
    projectId = pId;

    // Login to get session headers
    const loginResult = await testUtils.login({ userId });
    // Set active organization
    await auth.api.setActiveOrganization({
      headers: loginResult.headers,
      body: { organizationId },
    });
    // Get fresh auth headers with active org
    authHeaders = await testUtils.getAuthHeaders({ userId });
    // Set active org again on the new session
    await auth.api.setActiveOrganization({
      headers: authHeaders,
      body: { organizationId },
    });
    // Refresh headers one more time
    authHeaders = await testUtils.getAuthHeaders({ userId });
  });

  afterAll(async () => {
    // Cleanup
    await db
      .delete(schema.issue)
      .where(eq(schema.issue.projectId, projectId))
      .catch(() => {});
    await db
      .delete(schema.sprint)
      .where(eq(schema.sprint.projectId, projectId))
      .catch(() => {});
    await db
      .delete(schema.project)
      .where(eq(schema.project.id, projectId))
      .catch(() => {});
    await db
      .delete(schema.member)
      .where(eq(schema.member.id, memberId))
      .catch(() => {});
    await db
      .delete(schema.organization)
      .where(eq(schema.organization.id, organizationId))
      .catch(() => {});
    if (userId) await testUtils.deleteUser(userId);
  });

  describe("sprint CRUD with new fields", () => {
    let sprintId: string;

    afterAll(async () => {
      if (sprintId) {
        await db.delete(schema.sprint).where(eq(schema.sprint.id, sprintId));
      }
    });

    it("should create a sprint with duration, owner, and release status", async () => {
      const { status, data } = await apiRequest("/api/sprints", {
        method: "POST",
        body: {
          projectId,
          name: "Sprint Alpha",
          goal: "Test goal",
          startDate: "2026-03-16",
          endDate: "2026-03-30",
          duration: "2w",
          ownerId: memberId,
          releaseStatus: "pre_release",
        },
      });

      expect(status).toBe(201);
      expect(data.name).toBe("Sprint Alpha");
      expect(data.status).toBe("draft");
      expect(data.duration).toBe("2w");
      expect(data.ownerId).toBe(memberId);
      expect(data.releaseStatus).toBe("pre_release");
      sprintId = data.id;
    });

    it("should list sprints with owner relation", async () => {
      const { status, data } = await apiRequest(
        `/api/sprints?projectId=${projectId}`,
      );

      expect(status).toBe(200);
      expect(data.length).toBeGreaterThanOrEqual(1);
      const sprint = data.find((s: any) => s.id === sprintId);
      expect(sprint).toBeDefined();
      expect(sprint.owner).toBeDefined();
      expect(sprint.owner.user.name).toBe("Sprint Test User");
    });

    it("should get sprint by id with owner", async () => {
      const { status, data } = await apiRequest(`/api/sprints/${sprintId}`);

      expect(status).toBe(200);
      expect(data.owner).toBeDefined();
      expect(data.owner.user.id).toBe(userId);
    });

    it("should update sprint fields", async () => {
      const { status, data } = await apiRequest(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        body: {
          duration: "3w",
          releaseStatus: "release_candidate",
        },
      });

      expect(status).toBe(200);
      expect(data.duration).toBe("3w");
      expect(data.releaseStatus).toBe("release_candidate");
    });
  });

  describe("status transitions", () => {
    let sprintId: string;

    beforeAll(async () => {
      const [s] = await db
        .insert(schema.sprint)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          projectId,
          name: "Transition Sprint",
          startDate: new Date("2026-03-16"),
          endDate: new Date("2026-03-30"),
          status: "draft",
          duration: "2w",
        })
        .returning();
      sprintId = s.id;
    });

    afterAll(async () => {
      if (sprintId) {
        await db.delete(schema.sprint).where(eq(schema.sprint.id, sprintId));
      }
    });

    it("should transition draft -> planned", async () => {
      const { status, data } = await apiRequest(
        `/api/sprints/${sprintId}/transition`,
        { method: "POST", body: { status: "planned" } },
      );
      expect(status).toBe(200);
      expect(data.status).toBe("planned");
    });

    it("should reject invalid transition planned -> completed", async () => {
      const { status, data } = await apiRequest(
        `/api/sprints/${sprintId}/transition`,
        { method: "POST", body: { status: "completed" } },
      );
      expect(status).toBe(400);
      expect(data.error).toContain("Invalid transition");
    });

    it("should transition planned -> active", async () => {
      const { status, data } = await apiRequest(
        `/api/sprints/${sprintId}/transition`,
        { method: "POST", body: { status: "active" } },
      );
      expect(status).toBe(200);
      expect(data.status).toBe("active");
    });

    it("should transition active -> in_review", async () => {
      const { status, data } = await apiRequest(
        `/api/sprints/${sprintId}/transition`,
        { method: "POST", body: { status: "in_review" } },
      );
      expect(status).toBe(200);
      expect(data.status).toBe("in_review");
    });

    it("should allow in_review -> active (back)", async () => {
      const { status, data } = await apiRequest(
        `/api/sprints/${sprintId}/transition`,
        { method: "POST", body: { status: "active" } },
      );
      expect(status).toBe(200);
      expect(data.status).toBe("active");
    });

    it("should transition back to in_review then complete", async () => {
      // Go to in_review
      const { status: s1 } = await apiRequest(
        `/api/sprints/${sprintId}/transition`,
        { method: "POST", body: { status: "in_review" } },
      );
      expect(s1).toBe(200);
    });

    it("should reject completion without retrospective", async () => {
      const { status, data } = await apiRequest(
        `/api/sprints/${sprintId}/transition`,
        { method: "POST", body: { status: "completed" } },
      );
      expect(status).toBe(400);
      expect(data.error).toContain("Retrospective is required");
    });

    it("should complete with retrospective", async () => {
      const { status, data } = await apiRequest(
        `/api/sprints/${sprintId}/transition`,
        {
          method: "POST",
          body: {
            status: "completed",
            retrospective: "Great sprint, delivered on time.",
          },
        },
      );
      expect(status).toBe(200);
      expect(data.status).toBe("completed");
      expect(data.retrospective).toBe("Great sprint, delivered on time.");
    });
  });

  describe("only one active sprint constraint", () => {
    let sprint1Id: string;
    let sprint2Id: string;

    beforeAll(async () => {
      const [s1] = await db
        .insert(schema.sprint)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          projectId,
          name: "Active Sprint 1",
          startDate: new Date("2026-04-01"),
          endDate: new Date("2026-04-14"),
          status: "active",
          duration: "2w",
        })
        .returning();
      sprint1Id = s1.id;

      const [s2] = await db
        .insert(schema.sprint)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          projectId,
          name: "Planned Sprint 2",
          startDate: new Date("2026-04-15"),
          endDate: new Date("2026-04-28"),
          status: "planned",
          duration: "2w",
        })
        .returning();
      sprint2Id = s2.id;
    });

    afterAll(async () => {
      await db
        .delete(schema.sprint)
        .where(eq(schema.sprint.id, sprint1Id))
        .catch(() => {});
      await db
        .delete(schema.sprint)
        .where(eq(schema.sprint.id, sprint2Id))
        .catch(() => {});
    });

    it("should reject starting a second sprint when one is already active", async () => {
      const { status, data } = await apiRequest(
        `/api/sprints/${sprint2Id}/transition`,
        { method: "POST", body: { status: "active" } },
      );
      expect(status).toBe(409);
      expect(data.error).toContain("already an active sprint");
    });
  });

  describe("incomplete issues moved to backlog on completion", () => {
    let sprintId: string;
    let doneIssueId: string;
    let todoIssueId: string;

    beforeAll(async () => {
      const [s] = await db
        .insert(schema.sprint)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          projectId,
          name: "Backlog Test Sprint",
          startDate: new Date("2026-05-01"),
          endDate: new Date("2026-05-14"),
          status: "in_review",
          duration: "2w",
        })
        .returning();
      sprintId = s.id;

      const [doneIssue] = await db
        .insert(schema.issue)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          projectId,
          sprintId,
          title: "Done Issue",
          status: "done",
          priority: "medium",
        })
        .returning();
      doneIssueId = doneIssue.id;

      const [todoIssue] = await db
        .insert(schema.issue)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          projectId,
          sprintId,
          title: "Todo Issue",
          status: "todo",
          priority: "medium",
        })
        .returning();
      todoIssueId = todoIssue.id;
    });

    afterAll(async () => {
      await db
        .delete(schema.issue)
        .where(eq(schema.issue.id, doneIssueId))
        .catch(() => {});
      await db
        .delete(schema.issue)
        .where(eq(schema.issue.id, todoIssueId))
        .catch(() => {});
      await db
        .delete(schema.sprint)
        .where(eq(schema.sprint.id, sprintId))
        .catch(() => {});
    });

    it("should move incomplete issues to backlog when completing", async () => {
      const { status } = await apiRequest(
        `/api/sprints/${sprintId}/transition`,
        {
          method: "POST",
          body: {
            status: "completed",
            retrospective: "Moving incomplete issues to backlog test.",
          },
        },
      );
      expect(status).toBe(200);

      // Check done issue still has sprintId
      const doneIssue = await db.query.issue.findFirst({
        where: eq(schema.issue.id, doneIssueId),
      });
      expect(doneIssue!.sprintId).toBe(sprintId);

      // Check todo issue was moved to backlog (sprintId = null)
      const todoIssue = await db.query.issue.findFirst({
        where: eq(schema.issue.id, todoIssueId),
      });
      expect(todoIssue!.sprintId).toBeNull();
    });
  });

  describe("sprint comments CRUD", () => {
    let sprintId: string;
    let commentId: string;

    beforeAll(async () => {
      const [s] = await db
        .insert(schema.sprint)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          projectId,
          name: "Comments Test Sprint",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-14"),
          status: "active",
          duration: "2w",
        })
        .returning();
      sprintId = s.id;
    });

    afterAll(async () => {
      await db
        .delete(schema.sprintComment)
        .where(eq(schema.sprintComment.sprintId, sprintId))
        .catch(() => {});
      await db
        .delete(schema.sprint)
        .where(eq(schema.sprint.id, sprintId))
        .catch(() => {});
    });

    it("should create a sprint comment", async () => {
      const { status, data } = await apiRequest("/api/sprint-comments", {
        method: "POST",
        body: {
          sprintId,
          content: "Sprint is going well!",
          type: "update",
        },
      });

      expect(status).toBe(201);
      expect(data.content).toBe("Sprint is going well!");
      expect(data.type).toBe("update");
      expect(data.sprintId).toBe(sprintId);
      commentId = data.id;
    });

    it("should list sprint comments", async () => {
      const { status, data } = await apiRequest(
        `/api/sprint-comments?sprintId=${sprintId}`,
      );

      expect(status).toBe(200);
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data[0].author).toBeDefined();
      expect(data[0].author.name).toBe("Sprint Test User");
    });

    it("should update own comment", async () => {
      const { status, data } = await apiRequest(
        `/api/sprint-comments/${commentId}`,
        {
          method: "PATCH",
          body: { content: "Updated comment" },
        },
      );

      expect(status).toBe(200);
      expect(data.content).toBe("Updated comment");
    });

    it("should create a retrospective comment", async () => {
      const { status, data } = await apiRequest("/api/sprint-comments", {
        method: "POST",
        body: {
          sprintId,
          content: "Lessons learned: test early.",
          type: "retrospective",
        },
      });

      expect(status).toBe(201);
      expect(data.type).toBe("retrospective");
    });

    it("should delete own comment", async () => {
      const { status, data } = await apiRequest(
        `/api/sprint-comments/${commentId}`,
        { method: "DELETE" },
      );

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("planned -> draft back transition", () => {
    let sprintId: string;

    beforeAll(async () => {
      const [s] = await db
        .insert(schema.sprint)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          projectId,
          name: "Back to Draft Sprint",
          startDate: new Date("2026-07-01"),
          endDate: new Date("2026-07-14"),
          status: "planned",
          duration: "2w",
        })
        .returning();
      sprintId = s.id;
    });

    afterAll(async () => {
      await db
        .delete(schema.sprint)
        .where(eq(schema.sprint.id, sprintId))
        .catch(() => {});
    });

    it("should transition planned -> draft", async () => {
      const { status, data } = await apiRequest(
        `/api/sprints/${sprintId}/transition`,
        { method: "POST", body: { status: "draft" } },
      );
      expect(status).toBe(200);
      expect(data.status).toBe("draft");
    });
  });

  describe("release status", () => {
    let sprintId: string;

    afterAll(async () => {
      if (sprintId) {
        await db
          .delete(schema.sprint)
          .where(eq(schema.sprint.id, sprintId))
          .catch(() => {});
      }
    });

    it("should create sprint with release status and retrieve it", async () => {
      const { status, data } = await apiRequest("/api/sprints", {
        method: "POST",
        body: {
          projectId,
          name: "Release Sprint",
          startDate: "2026-08-01",
          endDate: "2026-08-14",
          duration: "2w",
          releaseStatus: "released",
        },
      });

      expect(status).toBe(201);
      expect(data.releaseStatus).toBe("released");
      sprintId = data.id;

      const { data: fetched } = await apiRequest(`/api/sprints/${sprintId}`);
      expect(fetched.releaseStatus).toBe("released");
    });
  });
});
