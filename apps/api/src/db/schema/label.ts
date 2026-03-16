import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { issueLabel } from "./issue-label";

export const label = pgTable(
  "label",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("label_org_name_uidx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

export const labelRelations = relations(label, ({ one, many }) => ({
  organization: one(organization, {
    fields: [label.organizationId],
    references: [organization.id],
  }),
  issueLabels: many(issueLabel),
}));
