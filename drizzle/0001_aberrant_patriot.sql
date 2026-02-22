CREATE TYPE "public"."fact_type" AS ENUM('generic');--> statement-breakpoint
CREATE TABLE "facts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"type" "fact_type" DEFAULT 'generic' NOT NULL,
	"srs_level" integer DEFAULT 0 NOT NULL,
	"next_scheduled_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "facts" ADD CONSTRAINT "facts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;