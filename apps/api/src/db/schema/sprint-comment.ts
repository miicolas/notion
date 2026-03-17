import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { sprint } from "./sprint";

export const sprintComment = pgTable(
  "sprint_comment",
  {
    id: text("id").primaryKey(),
    sprintId: text("sprint_id")
      .notNull()
      .references(() => sprint.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    type: text("type", { enum: ["update", "retrospective"] })
      .default("update")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sprintComment_sprintId_idx").on(table.sprintId),
    index("sprintComment_authorId_idx").on(table.authorId),
  ],
);

export const sprintCommentRelations = relations(sprintComment, ({ one }) => ({
  sprint: one(sprint, {
    fields: [sprintComment.sprintId],
    references: [sprint.id],
  }),
  author: one(user, {
    fields: [sprintComment.authorId],
    references: [user.id],
  }),
}));
