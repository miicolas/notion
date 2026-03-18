import { Hono } from "hono";
import { z } from "zod/v4";
import cron from "node-cron";
import type { AdminContext } from "../middleware/admin";
import {
  runBackup,
  listBackups,
  getBackupDownloadUrl,
  deleteBackup,
  getBackupConfig,
  updateBackupConfig,
} from "../services/backup";
import { syncCron } from "../services/backup-cron";

const app = new Hono<{ Variables: { admin: AdminContext } }>();

const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  cronExpression: z
    .string()
    .refine((v) => cron.validate(v), { message: "Invalid cron expression" })
    .optional(),
  s3Bucket: z
    .string()
    .regex(/^[a-z0-9][a-z0-9.\-]{1,61}[a-z0-9]$/, "Invalid S3 bucket name")
    .optional(),
  s3Region: z
    .string()
    .regex(/^[a-z]{2}-[a-z]+-\d$/, "Invalid AWS region")
    .optional(),
});

// GET /api/admin/backups
app.get("/", async (c) => {
  const backups = await listBackups();
  return c.json(backups);
});

// POST /api/admin/backups — trigger a backup now
app.post("/", async (c) => {
  try {
    const result = await runBackup();
    return c.json(result, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backup failed";
    const status = message === "A backup is already in progress" ? 409 : 500;
    return c.json({ error: message }, status);
  }
});

// GET /api/admin/backups/:id/download
app.get("/:id/download", async (c) => {
  const id = c.req.param("id");
  try {
    const url = await getBackupDownloadUrl(id);
    if (!url) return c.json({ error: "Download not available" }, 404);
    return c.json({ downloadUrl: url });
  } catch {
    return c.json({ error: "Failed to generate download URL" }, 500);
  }
});

// DELETE /api/admin/backups/:id
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await deleteBackup(id);
    return c.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    const status = message === "Backup not found" ? 404 : 500;
    return c.json({ error: message }, status);
  }
});

// GET /api/admin/backups/config
app.get("/config", async (c) => {
  const config = await getBackupConfig();
  return c.json(config);
});

// PATCH /api/admin/backups/config
app.patch("/config", async (c) => {
  const body = await c.req.json();
  const parsed = updateConfigSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const config = await updateBackupConfig(parsed.data);

  await syncCron();

  return c.json(config);
});

export default app;
