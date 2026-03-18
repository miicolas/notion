import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteObject,
} from "../services/s3";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const app = new Hono<{ Variables: { auth: AuthContext } }>();

app.use("*", authMiddleware);

// POST /api/assets/presign
app.post("/presign", async (c) => {
  const { organizationId } = c.get("auth");
  const body = await c.req.json();
  const { filename, mimeType, size } = body;

  if (!filename || !mimeType || !size) {
    return c.json({ error: "filename, mimeType, and size are required" }, 400);
  }

  if (size > MAX_FILE_SIZE) {
    return c.json({ error: "File size exceeds 10MB limit" }, 400);
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return c.json({ error: "File type not allowed" }, 400);
  }

  const assetId = crypto.randomUUID();
  const key = `${organizationId}/${crypto.randomUUID()}/${filename}`;

  const uploadUrl = await getPresignedUploadUrl(key, mimeType);

  return c.json({ uploadUrl, key, assetId, mimeType });
});

// POST /api/assets/confirm
app.post("/confirm", async (c) => {
  const { organizationId, userId } = c.get("auth");
  const body = await c.req.json();
  const { assetId, key, filename, mimeType, size, issueId, commentId } = body;

  if (!assetId || !key || !filename || !mimeType || !size) {
    return c.json(
      { error: "assetId, key, filename, mimeType, and size are required" },
      400,
    );
  }

  const [created] = await db
    .insert(schema.asset)
    .values({
      id: assetId,
      organizationId,
      key,
      filename,
      mimeType,
      size,
      uploadedById: userId,
    })
    .returning();

  if (issueId) {
    await db.insert(schema.issueAsset).values({
      issueId,
      assetId,
    });
  }

  if (commentId) {
    await db.insert(schema.commentAsset).values({
      commentId,
      assetId,
    });
  }

  return c.json(created, 201);
});

// GET /api/assets/:id/download
app.get("/:id/download", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const found = await db.query.asset.findFirst({
    where: and(
      eq(schema.asset.id, id),
      eq(schema.asset.organizationId, organizationId),
    ),
  });

  if (!found) return c.json({ error: "Not found" }, 404);

  const url = await getPresignedDownloadUrl(found.key);
  return c.json({ url });
});

// DELETE /api/assets/:id
app.delete("/:id", async (c) => {
  const { organizationId } = c.get("auth");
  const id = c.req.param("id");

  const found = await db.query.asset.findFirst({
    where: and(
      eq(schema.asset.id, id),
      eq(schema.asset.organizationId, organizationId),
    ),
  });

  if (!found) return c.json({ error: "Not found" }, 404);

  await deleteObject(found.key);

  await db
    .delete(schema.asset)
    .where(eq(schema.asset.id, id));

  return c.json({ success: true });
});

export default app;
