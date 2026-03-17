import { relations } from "drizzle-orm";
import { pgTable, text, primaryKey } from "drizzle-orm/pg-core";
import { sprint } from "./sprint";
import { member } from "./auth";

export const sprintMember = pgTable(
  "sprint_member",
  {
    sprintId: text("sprint_id")
      .notNull()
      .references(() => sprint.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.sprintId, table.memberId] })],
);

export const sprintMemberRelations = relations(sprintMember, ({ one }) => ({
  sprint: one(sprint, {
    fields: [sprintMember.sprintId],
    references: [sprint.id],
  }),
  member: one(member, {
    fields: [sprintMember.memberId],
    references: [member.id],
  }),
}));
