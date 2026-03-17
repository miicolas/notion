CREATE TABLE "sprint_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"sprint_id" text NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'update' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sprint" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "sprint" ADD COLUMN "duration" text DEFAULT '2w' NOT NULL;--> statement-breakpoint
ALTER TABLE "sprint" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "sprint" ADD COLUMN "release_status" text;--> statement-breakpoint
ALTER TABLE "sprint" ADD COLUMN "retrospective" text;--> statement-breakpoint
ALTER TABLE "sprint_comment" ADD CONSTRAINT "sprint_comment_sprint_id_sprint_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint_comment" ADD CONSTRAINT "sprint_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sprintComment_sprintId_idx" ON "sprint_comment" USING btree ("sprint_id");--> statement-breakpoint
CREATE INDEX "sprintComment_authorId_idx" ON "sprint_comment" USING btree ("author_id");--> statement-breakpoint
ALTER TABLE "sprint" ADD CONSTRAINT "sprint_owner_id_member_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sprint_ownerId_idx" ON "sprint" USING btree ("owner_id");