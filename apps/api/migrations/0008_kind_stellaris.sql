CREATE TABLE "asset" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"key" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_asset" (
	"comment_id" text NOT NULL,
	"asset_id" text NOT NULL,
	CONSTRAINT "comment_asset_comment_id_asset_id_pk" PRIMARY KEY("comment_id","asset_id")
);
--> statement-breakpoint
CREATE TABLE "issue_asset" (
	"issue_id" text NOT NULL,
	"asset_id" text NOT NULL,
	CONSTRAINT "issue_asset_issue_id_asset_id_pk" PRIMARY KEY("issue_id","asset_id")
);
--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_asset" ADD CONSTRAINT "comment_asset_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_asset" ADD CONSTRAINT "comment_asset_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_asset" ADD CONSTRAINT "issue_asset_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_asset" ADD CONSTRAINT "issue_asset_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_organizationId_idx" ON "asset" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "asset_uploadedById_idx" ON "asset" USING btree ("uploaded_by_id");