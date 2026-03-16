import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { organization, member } from "./auth";
import { project } from "./project";
import { issueLabel } from "./issue-label";
import { comment } from "./comment";

export const issue = pgTable(
  "issue",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id").references(() => member.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", {
      enum: ["backlog", "todo", "in_progress", "done", "cancelled"],
    })
      .default("backlog")
      .notNull(),
    priority: text("priority", {
      enum: ["urgent", "high", "medium", "low", "no_priority"],
    })
      .default("no_priority")
      .notNull(),
    deadline: timestamp("deadline"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("issue_organizationId_idx").on(table.organizationId),
    index("issue_projectId_idx").on(table.projectId),
    index("issue_assigneeId_idx").on(table.assigneeId),
    index("issue_status_idx").on(table.status),
  ],
);

export const issueRelations = relations(issue, ({ one, many }) => ({
  organization: one(organization, {
    fields: [issue.organizationId],
    references: [organization.id],
  }),
  project: one(project, {
    fields: [issue.projectId],
    references: [project.id],
  }),
  assignee: one(member, {
    fields: [issue.assigneeId],
    references: [member.id],
  }),
  issueLabels: many(issueLabel),
  comments: many(comment),
}));
