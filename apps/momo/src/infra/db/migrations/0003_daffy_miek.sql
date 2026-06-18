ALTER TABLE "content_post_revisions" DROP COLUMN "format";--> statement-breakpoint
ALTER TABLE "content_posts" DROP COLUMN "format";--> statement-breakpoint
DROP TYPE "public"."content_post_format";