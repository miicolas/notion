import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { adminMiddleware, type AdminContext } from "../middleware/admin";

const app = new Hono<{ Variables: { admin: AdminContext } }>();

app.use("*", adminMiddleware);

// GET /api/admin/stats
app.get("/stats", async (c) => {
  const [users, orgs, projects, issues, members, sprints] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(schema.user),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.organization),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.project),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.issue),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.member),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.sprint),
  ]);

  return c.json({
    totalUsers: users[0].count,
    totalOrgs: orgs[0].count,
    totalProjects: projects[0].count,
    totalIssues: issues[0].count,
    totalMembers: members[0].count,
    totalSprints: sprints[0].count,
  });
});

// GET /api/admin/users
app.get("/users", async (c) => {
  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
      createdAt: schema.user.createdAt,
      banned: schema.user.banned,
    })
    .from(schema.user)
    .orderBy(schema.user.createdAt);

  return c.json(users);
});

// GET /api/admin/organizations
app.get("/organizations", async (c) => {
  const orgs = await db
    .select({
      id: schema.organization.id,
      name: schema.organization.name,
      slug: schema.organization.slug,
      logo: schema.organization.logo,
      createdAt: schema.organization.createdAt,
      memberCount: sql<number>`count(${schema.member.id})::int`,
    })
    .from(schema.organization)
    .leftJoin(
      schema.member,
      sql`${schema.member.organizationId} = ${schema.organization.id}`,
    )
    .groupBy(schema.organization.id)
    .orderBy(schema.organization.createdAt);

  return c.json(orgs);
});

// GET /api/admin/charts/users-growth
app.get("/charts/users-growth", async (c) => {
  const data = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${schema.user.createdAt}), 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.user)
    .where(sql`${schema.user.createdAt} >= now() - interval '12 months'`)
    .groupBy(sql`date_trunc('month', ${schema.user.createdAt})`)
    .orderBy(sql`date_trunc('month', ${schema.user.createdAt})`);

  return c.json(data);
});

// GET /api/admin/charts/issues-over-time
app.get("/charts/issues-over-time", async (c) => {
  const data = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${schema.issue.createdAt}), 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.issue)
    .where(sql`${schema.issue.createdAt} >= now() - interval '12 months'`)
    .groupBy(sql`date_trunc('month', ${schema.issue.createdAt})`)
    .orderBy(sql`date_trunc('month', ${schema.issue.createdAt})`);

  return c.json(data);
});

// GET /api/admin/charts/issues-by-status
app.get("/charts/issues-by-status", async (c) => {
  const data = await db
    .select({
      status: schema.issue.status,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.issue)
    .groupBy(schema.issue.status);

  return c.json(data);
});

// GET /api/admin/charts/issues-by-priority
app.get("/charts/issues-by-priority", async (c) => {
  const data = await db
    .select({
      priority: schema.issue.priority,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.issue)
    .groupBy(schema.issue.priority);

  return c.json(data);
});

// GET /api/admin/charts/orgs-activity
app.get("/charts/orgs-activity", async (c) => {
  const data = await db
    .select({
      orgName: schema.organization.name,
      count: sql<number>`count(${schema.issue.id})::int`,
    })
    .from(schema.organization)
    .leftJoin(
      schema.issue,
      sql`${schema.issue.organizationId} = ${schema.organization.id}`,
    )
    .groupBy(schema.organization.id, schema.organization.name)
    .orderBy(sql`count(${schema.issue.id}) desc`)
    .limit(10);

  return c.json(data);
});

// GET /api/admin/charts/projects-per-org
app.get("/charts/projects-per-org", async (c) => {
  const data = await db
    .select({
      orgName: schema.organization.name,
      count: sql<number>`count(${schema.project.id})::int`,
    })
    .from(schema.organization)
    .leftJoin(
      schema.project,
      sql`${schema.project.organizationId} = ${schema.organization.id}`,
    )
    .groupBy(schema.organization.id, schema.organization.name)
    .orderBy(sql`count(${schema.project.id}) desc`)
    .limit(10);

  return c.json(data);
});

// GET /api/admin/charts/users-per-org
app.get("/charts/users-per-org", async (c) => {
  const data = await db
    .select({
      orgName: schema.organization.name,
      count: sql<number>`count(${schema.member.id})::int`,
    })
    .from(schema.organization)
    .leftJoin(
      schema.member,
      sql`${schema.member.organizationId} = ${schema.organization.id}`,
    )
    .groupBy(schema.organization.id, schema.organization.name)
    .orderBy(sql`count(${schema.member.id}) desc`)
    .limit(10);

  return c.json(data);
});

export default app;
