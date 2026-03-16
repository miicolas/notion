import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { project } from "./project";

export const client = pgTable(
  "client",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    website: text("website"),
    logo: text("logo"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("client_organizationId_idx").on(table.organizationId)],
);

export const clientRelations = relations(client, ({ one, many }) => ({
  organization: one(organization, {
    fields: [client.organizationId],
    references: [organization.id],
  }),
  projects: many(project),
}));
