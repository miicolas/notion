import { Hono } from "hono";
import { sql, eq, and } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// GET /api/dashboard/stats
app.get("/stats", async (c) => {
  const { organizationId } = c.get("auth");

  const [
    issuesByStatus,
    issuesByPriority,
    issuesByAssignee,
    issuesByProject,
    issuesOverTime,
  ] = await Promise.all([
    db
      .select({
        status: schema.issue.status,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.issue)
      .where(eq(schema.issue.organizationId, organizationId))
      .groupBy(schema.issue.status),

    db
      .select({
        priority: schema.issue.priority,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.issue)
      .where(eq(schema.issue.organizationId, organizationId))
      .groupBy(schema.issue.priority),

    db
      .select({
        assigneeId: schema.member.id,
        assigneeName: schema.user.name,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.issue)
      .innerJoin(schema.member, eq(schema.issue.assigneeId, schema.member.id))
      .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
      .where(eq(schema.issue.organizationId, organizationId))
      .groupBy(schema.member.id, schema.user.name),

    db
      .select({
        projectId: schema.project.id,
        projectName: schema.project.name,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.issue)
      .innerJoin(schema.project, eq(schema.issue.projectId, schema.project.id))
      .where(eq(schema.issue.organizationId, organizationId))
      .groupBy(schema.project.id, schema.project.name),

    db
      .select({
        date: sql<string>`to_char(date_trunc('week', ${schema.issue.createdAt}), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.issue)
      .where(
        and(
          eq(schema.issue.organizationId, organizationId),
          sql`${schema.issue.createdAt} >= now() - interval '12 weeks'`,
        ),
      )
      .groupBy(sql`date_trunc('week', ${schema.issue.createdAt})`)
      .orderBy(sql`date_trunc('week', ${schema.issue.createdAt})`),
  ]);

  return c.json({
    issuesByStatus,
    issuesByPriority,
    issuesByAssignee,
    issuesByProject,
    issuesOverTime,
  });
});

export default app;
