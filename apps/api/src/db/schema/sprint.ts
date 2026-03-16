import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { project } from "./project";
import { issue } from "./issue";

export const sprint = pgTable(
  "sprint",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    goal: text("goal"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    status: text("status", { enum: ["planned", "active", "completed"] })
      .default("planned")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sprint_organizationId_idx").on(table.organizationId),
    index("sprint_projectId_idx").on(table.projectId),
    index("sprint_status_idx").on(table.status),
  ],
);

export const sprintRelations = relations(sprint, ({ one, many }) => ({
  organization: one(organization, {
    fields: [sprint.organizationId],
    references: [organization.id],
  }),
  project: one(project, {
    fields: [sprint.projectId],
    references: [project.id],
  }),
  issues: many(issue),
}));
