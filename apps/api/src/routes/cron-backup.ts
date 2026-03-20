import { Hono } from "hono";
import { env } from "../env";
import { runBackup } from "../services/backup";

const app = new Hono();

// POST /api/cron/backup — triggered by AWS EventBridge via Lambda
app.post("/", async (c) => {
  const secret = c.req.header("x-cron-secret");

  if (!env.CRON_SECRET) {
    return c.json({ error: "CRON_SECRET not configured on server" }, 500);
  }

  if (!secret || secret !== env.CRON_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const result = await runBackup();
    return c.json({ ok: true, ...result }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backup failed";
    const status = message === "A backup is already in progress" ? 409 : 500;
    return c.json({ error: message }, status);
  }
});

export default app;
