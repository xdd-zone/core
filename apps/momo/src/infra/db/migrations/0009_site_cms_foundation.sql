CREATE TYPE "public"."preview_target_type" AS ENUM('post', 'project', 'site-page');
--> statement-breakpoint
CREATE TYPE "public"."event_outbox_status" AS ENUM('pending', 'processing', 'done', 'failed');
--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'published', 'archived');
--> statement-breakpoint
ALTER TABLE "content_posts" ADD COLUMN "draft_slug" text;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD COLUMN "published_slug" text;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD COLUMN "draft_title" text;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD COLUMN "published_title" text;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD COLUMN "draft_excerpt" text;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD COLUMN "published_excerpt" text;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD COLUMN "draft_cover_asset_id" text;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD COLUMN "published_cover_asset_id" text;
--> statement-breakpoint
UPDATE "content_posts"
SET
  "draft_slug" = "slug",
  "published_slug" = CASE WHEN "status" = 'published' THEN "slug" ELSE NULL END,
  "draft_title" = "title",
  "published_title" = CASE WHEN "status" = 'published' THEN "title" ELSE NULL END,
  "draft_excerpt" = "excerpt",
  "published_excerpt" = CASE WHEN "status" = 'published' THEN "excerpt" ELSE NULL END,
  "draft_cover_asset_id" = "cover_asset_id",
  "published_cover_asset_id" = CASE WHEN "status" = 'published' THEN "cover_asset_id" ELSE NULL END;
--> statement-breakpoint
ALTER TABLE "content_posts" ALTER COLUMN "draft_slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "content_posts" ALTER COLUMN "draft_title" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_draft_cover_asset_id_content_assets_id_fk" FOREIGN KEY ("draft_cover_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_published_cover_asset_id_content_assets_id_fk" FOREIGN KEY ("published_cover_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "content_posts_published_slug_unique" ON "content_posts" USING btree ("published_slug");
--> statement-breakpoint
ALTER TABLE "content_preview_tokens" ADD COLUMN "target_type" "preview_target_type" DEFAULT 'post';
--> statement-breakpoint
ALTER TABLE "content_preview_tokens" ADD COLUMN "target_id" text;
--> statement-breakpoint
UPDATE "content_preview_tokens" SET "target_type" = 'post', "target_id" = "post_id";
--> statement-breakpoint
ALTER TABLE "content_preview_tokens" ALTER COLUMN "target_type" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "content_preview_tokens_target_idx" ON "content_preview_tokens" USING btree ("target_type","target_id");
--> statement-breakpoint
CREATE TABLE "event_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "event_outbox_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_outbox_status_next_run_idx" ON "event_outbox" USING btree ("status","next_run_at");
--> statement-breakpoint
CREATE INDEX "event_outbox_event_type_idx" ON "event_outbox" USING btree ("event_type");
--> statement-breakpoint
CREATE TABLE "site_configs" (
	"site_key" text PRIMARY KEY NOT NULL,
	"navigation" jsonb NOT NULL,
	"home_sections" jsonb NOT NULL,
	"seo" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "site_configs" ("site_key", "navigation", "home_sections", "seo")
VALUES (
  'bobo',
  '[{"id":"home","label":"首页","href":"/","order":0,"visible":true},{"id":"writing","label":"文稿","href":"/writing","order":10,"visible":true},{"id":"projects","label":"项目","href":"/projects","order":20,"visible":true}]'::jsonb,
  '[{"id":"profile","type":"profile","order":0,"visible":true},{"id":"writing","type":"writing","order":10,"visible":true},{"id":"projects","type":"projects","order":20,"visible":true}]'::jsonb,
  '{"title":"XDD Zone","description":"喜东东的个人站"}'::jsonb
) ON CONFLICT ("site_key") DO NOTHING;
--> statement-breakpoint
CREATE TABLE "public_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_asset_id" text,
	"bio" text,
	"contact_email" text,
	"social_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public_profiles" ADD CONSTRAINT "public_profiles_avatar_asset_id_content_assets_id_fk" FOREIGN KEY ("avatar_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "public_profiles" ("id", "display_name", "social_links")
VALUES ('bobo', '喜东东', '[]'::jsonb)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"draft_slug" text NOT NULL,
	"published_slug" text,
	"draft_title" text NOT NULL,
	"published_title" text,
	"draft_description" text,
	"published_description" text,
	"draft_cover_asset_id" text,
	"published_cover_asset_id" text,
	"draft_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"updated_by" text,
	"published_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_draft_cover_asset_id_content_assets_id_fk" FOREIGN KEY ("draft_cover_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_published_cover_asset_id_content_assets_id_fk" FOREIGN KEY ("published_cover_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_published_by_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "projects_draft_slug_unique" ON "projects" USING btree ("draft_slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "projects_published_slug_unique" ON "projects" USING btree ("published_slug");
--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "projects_order_idx" ON "projects" USING btree ("order");
