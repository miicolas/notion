import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const dbBackup = pgTable("db_backup", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  s3Key: text("s3_key").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  status: text("status", {
    enum: ["pending", "completed", "failed"],
  })
    .default("pending")
    .notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const backupConfig = pgTable("backup_config", {
  id: text("id").primaryKey().default("default"),
  enabled: boolean("enabled").default(false).notNull(),
  cronExpression: text("cron_expression").default("0 * * * *").notNull(), // every hour
  s3Bucket: text("s3_bucket").default("").notNull(),
  s3Region: text("s3_region").default("eu-west-1").notNull(),
  lastRunAt: timestamp("last_run_at"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
