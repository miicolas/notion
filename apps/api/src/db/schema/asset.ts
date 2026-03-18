import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { issue } from "./issue";
import { comment } from "./comment";

export const asset = pgTable(
  "asset",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    uploadedById: text("uploaded_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("asset_organizationId_idx").on(table.organizationId),
    index("asset_uploadedById_idx").on(table.uploadedById),
  ],
);

export const assetRelations = relations(asset, ({ one, many }) => ({
  organization: one(organization, {
    fields: [asset.organizationId],
    references: [organization.id],
  }),
  uploadedBy: one(user, {
    fields: [asset.uploadedById],
    references: [user.id],
  }),
  issueAssets: many(issueAsset),
  commentAssets: many(commentAsset),
}));

export const issueAsset = pgTable(
  "issue_asset",
  {
    issueId: text("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => asset.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.issueId, table.assetId] })],
);

export const issueAssetRelations = relations(issueAsset, ({ one }) => ({
  issue: one(issue, {
    fields: [issueAsset.issueId],
    references: [issue.id],
  }),
  asset: one(asset, {
    fields: [issueAsset.assetId],
    references: [asset.id],
  }),
}));

export const commentAsset = pgTable(
  "comment_asset",
  {
    commentId: text("comment_id")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => asset.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.commentId, table.assetId] })],
);

export const commentAssetRelations = relations(commentAsset, ({ one }) => ({
  comment: one(comment, {
    fields: [commentAsset.commentId],
    references: [comment.id],
  }),
  asset: one(asset, {
    fields: [commentAsset.assetId],
    references: [asset.id],
  }),
}));
