CREATE TYPE "public"."fact_type" AS ENUM('generic');--> statement-breakpoint
CREATE TABLE "fact_items" (
	"id" text PRIMARY KEY NOT NULL,
	"fact_id" text NOT NULL,
	"question" text NOT NULL,
	"canonical_answer" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_content" text NOT NULL,
	"type" "fact_type" DEFAULT 'generic' NOT NULL,
	"srs_level" integer DEFAULT 0 NOT NULL,
	"next_scheduled_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fact_items" ADD CONSTRAINT "fact_items_fact_id_facts_id_fk" FOREIGN KEY ("fact_id") REFERENCES "public"."facts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facts" ADD CONSTRAINT "facts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;