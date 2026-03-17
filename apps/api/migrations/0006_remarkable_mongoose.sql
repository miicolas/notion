CREATE TABLE "sprint_member" (
	"sprint_id" text NOT NULL,
	"member_id" text NOT NULL,
	CONSTRAINT "sprint_member_sprint_id_member_id_pk" PRIMARY KEY("sprint_id","member_id")
);
--> statement-breakpoint
ALTER TABLE "sprint_member" ADD CONSTRAINT "sprint_member_sprint_id_sprint_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint_member" ADD CONSTRAINT "sprint_member_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;