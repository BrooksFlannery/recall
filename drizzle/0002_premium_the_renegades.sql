ALTER TABLE "questions" DROP CONSTRAINT "questions_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "questions_user_id_idx";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "user_id";