import { Hono } from "hono";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "../db";

const app = new Hono();

app.post("/", async (c) => {
  const { password } = await c.req.json();

  if (!password || password !== process.env.MIGRATE_PASSWORD) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    return c.json({ success: true, message: "Migrations applied" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

export default app;
