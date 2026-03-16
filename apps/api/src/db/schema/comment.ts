import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { issue } from "./issue";

export const comment = pgTable(
  "comment",
  {
    id: text("id").primaryKey(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("comment_issueId_idx").on(table.issueId),
    index("comment_authorId_idx").on(table.authorId),
  ],
);

export const commentRelations = relations(comment, ({ one }) => ({
  issue: one(issue, {
    fields: [comment.issueId],
    references: [issue.id],
  }),
  author: one(user, {
    fields: [comment.authorId],
    references: [user.id],
  }),
}));
