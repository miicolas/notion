import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// GET /api/comments?issueId=xxx
app.get("/", async (c) => {
  const issueId = c.req.query("issueId");
  if (!issueId) return c.json({ error: "issueId is required" }, 400);

  const comments = await db.query.comment.findMany({
    where: eq(schema.comment.issueId, issueId),
    with: {
      author: { columns: { id: true, name: true, image: true } },
      commentAssets: { with: { asset: true } },
    },
    orderBy: (comment, { asc }) => [asc(comment.createdAt)],
  });

  return c.json(comments);
});

// POST /api/comments
app.post("/", async (c) => {
  const { userId } = c.get("auth");
  const body = await c.req.json();

  const id = crypto.randomUUID();
  const [created] = await db
    .insert(schema.comment)
    .values({
      id,
      issueId: body.issueId,
      authorId: userId,
      content: body.content,
    })
    .returning();

  if (body.assetIds?.length) {
    await db.insert(schema.commentAsset).values(
      body.assetIds.map((assetId: string) => ({
        commentId: id,
        assetId,
      })),
    );
  }

  return c.json(created, 201);
});

// PATCH /api/comments/:id
app.patch("/:id", async (c) => {
  const { userId } = c.get("auth");
  const id = c.req.param("id");
  const body = await c.req.json();

  const [updated] = await db
    .update(schema.comment)
    .set({ content: body.content })
    .where(
      and(eq(schema.comment.id, id), eq(schema.comment.authorId, userId)),
    )
    .returning();

  if (!updated) return c.json({ error: "Not found or not author" }, 404);
  return c.json(updated);
});

// DELETE /api/comments/:id
app.delete("/:id", async (c) => {
  const { userId } = c.get("auth");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(schema.comment)
    .where(
      and(eq(schema.comment.id, id), eq(schema.comment.authorId, userId)),
    )
    .returning();

  if (!deleted) return c.json({ error: "Not found or not author" }, 404);
  return c.json({ success: true });
});

export default app;
