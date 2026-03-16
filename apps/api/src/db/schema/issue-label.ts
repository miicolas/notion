import { relations } from "drizzle-orm";
import { pgTable, text, primaryKey } from "drizzle-orm/pg-core";
import { issue } from "./issue";
import { label } from "./label";

export const issueLabel = pgTable(
  "issue_label",
  {
    issueId: text("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => label.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.issueId, table.labelId] })],
);

export const issueLabelRelations = relations(issueLabel, ({ one }) => ({
  issue: one(issue, {
    fields: [issueLabel.issueId],
    references: [issue.id],
  }),
  label: one(label, {
    fields: [issueLabel.labelId],
    references: [label.id],
  }),
}));
