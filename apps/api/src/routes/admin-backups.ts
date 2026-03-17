import { Hono } from "hono";
import type { AdminContext } from "../middleware/admin";
import {
  runBackup,
  listBackups,
  deleteBackup,
  getBackupConfig,
  updateBackupConfig,
} from "../services/backup";
import { syncCron } from "../services/backup-cron";

const app = new Hono<{ Variables: { admin: AdminContext } }>();

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
    return c.json({ error: message }, 500);
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
    return c.json({ error: message }, 404);
  }
});

// GET /api/admin/backups/config
app.get("/config", async (c) => {
  const config = await getBackupConfig();
  return c.json(config);
});

// PATCH /api/admin/backups/config
app.patch("/config", async (c) => {
  const body = await c.req.json<{
    enabled?: boolean;
    cronExpression?: string;
    s3Bucket?: string;
    s3Region?: string;
  }>();

  const config = await updateBackupConfig(body);

  // Re-sync the cron scheduler with new config
  await syncCron();

  return c.json(config);
});

export default app;
