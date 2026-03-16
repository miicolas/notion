import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { client } from "./client";
import { issue } from "./issue";

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => client.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status", { enum: ["active", "archived"] })
      .default("active")
      .notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("project_organizationId_idx").on(table.organizationId),
    index("project_clientId_idx").on(table.clientId),
  ],
);

export const projectRelations = relations(project, ({ one, many }) => ({
  organization: one(organization, {
    fields: [project.organizationId],
    references: [organization.id],
  }),
  client: one(client, {
    fields: [project.clientId],
    references: [client.id],
  }),
  issues: many(issue),
}));
