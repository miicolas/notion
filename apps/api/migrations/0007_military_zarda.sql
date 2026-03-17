CREATE TABLE "backup_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"cron_expression" text DEFAULT '0 * * * *' NOT NULL,
	"s3_bucket" text DEFAULT '' NOT NULL,
	"s3_region" text DEFAULT 'eu-west-1' NOT NULL,
	"last_run_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_backup" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"s3_key" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
