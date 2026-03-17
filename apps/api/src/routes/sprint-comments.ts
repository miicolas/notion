import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// GET /api/sprint-comments?sprintId=xxx
app.get("/", async (c) => {
  const sprintId = c.req.query("sprintId");
  if (!sprintId) return c.json({ error: "sprintId is required" }, 400);

  const comments = await db.query.sprintComment.findMany({
    where: eq(schema.sprintComment.sprintId, sprintId),
    with: {
      author: { columns: { id: true, name: true, image: true } },
    },
    orderBy: (sc, { asc }) => [asc(sc.createdAt)],
  });

  return c.json(comments);
});

// POST /api/sprint-comments
app.post("/", async (c) => {
  const { userId } = c.get("auth");
  const body = await c.req.json();

  const id = crypto.randomUUID();
  const [created] = await db
    .insert(schema.sprintComment)
    .values({
      id,
      sprintId: body.sprintId,
      authorId: userId,
      content: body.content,
      type: body.type ?? "update",
    })
    .returning();

  return c.json(created, 201);
});

// PATCH /api/sprint-comments/:id
app.patch("/:id", async (c) => {
  const { userId } = c.get("auth");
  const id = c.req.param("id");
  const body = await c.req.json();

  const [updated] = await db
    .update(schema.sprintComment)
    .set({ content: body.content })
    .where(
      and(
        eq(schema.sprintComment.id, id),
        eq(schema.sprintComment.authorId, userId),
      ),
    )
    .returning();

  if (!updated) return c.json({ error: "Not found or not author" }, 404);
  return c.json(updated);
});

// DELETE /api/sprint-comments/:id
app.delete("/:id", async (c) => {
  const { userId } = c.get("auth");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(schema.sprintComment)
    .where(
      and(
        eq(schema.sprintComment.id, id),
        eq(schema.sprintComment.authorId, userId),
      ),
    )
    .returning();

  if (!deleted) return c.json({ error: "Not found or not author" }, 404);
  return c.json({ success: true });
});

export default app;
