import { handle } from "hono/aws-lambda";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { app } from "./app";

let migrated = false;
const honoHandler = handle(app);

export const handler: typeof honoHandler = async (event, context) => {
  if (!migrated) {
    await migrate(db, { migrationsFolder: "./migrations" });
    migrated = true;
  }
  return honoHandler(event, context);
};
