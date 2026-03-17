import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { organization, member } from "./auth";
import { project } from "./project";
import { issue } from "./issue";
import { sprintComment } from "./sprint-comment";
import { sprintMember } from "./sprint-member";

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
    status: text("status", {
      enum: ["draft", "planned", "active", "in_review", "completed"],
    })
      .default("draft")
      .notNull(),
    duration: text("duration", {
      enum: ["1w", "2w", "3w", "1m", "custom"],
    })
      .default("2w")
      .notNull(),
    ownerId: text("owner_id").references(() => member.id, {
      onDelete: "set null",
    }),
    releaseStatus: text("release_status", {
      enum: ["pre_release", "release_candidate", "released"],
    }),
    retrospective: text("retrospective"),
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
    index("sprint_ownerId_idx").on(table.ownerId),
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
  owner: one(member, {
    fields: [sprint.ownerId],
    references: [member.id],
  }),
  issues: many(issue),
  sprintComments: many(sprintComment),
  sprintMembers: many(sprintMember),
}));
