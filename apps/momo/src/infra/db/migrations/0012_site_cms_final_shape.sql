ALTER TABLE IF EXISTS "content_assets" RENAME TO "assets";
--> statement-breakpoint
ALTER TABLE IF EXISTS "assets" RENAME CONSTRAINT "content_assets_created_by_user_id_fk" TO "assets_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "content_posts" DROP CONSTRAINT IF EXISTS "content_posts_cover_asset_id_content_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "content_posts" DROP CONSTRAINT IF EXISTS "content_posts_category_id_content_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "content_posts" DROP CONSTRAINT IF EXISTS "content_posts_draft_cover_asset_id_content_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "content_posts" DROP CONSTRAINT IF EXISTS "content_posts_published_cover_asset_id_content_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "public_profiles" DROP CONSTRAINT IF EXISTS "public_profiles_avatar_asset_id_content_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_draft_cover_asset_id_content_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_published_cover_asset_id_content_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "content_preview_tokens" DROP CONSTRAINT IF EXISTS "content_preview_tokens_post_id_content_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "content_preview_tokens" DROP CONSTRAINT IF EXISTS "content_preview_tokens_revision_id_content_post_revisions_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "content_posts_slug_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "content_posts_category_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "content_preview_tokens_post_idx";
--> statement-breakpoint
ALTER TABLE "content_posts" ADD COLUMN IF NOT EXISTS "draft_category_id" text;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD COLUMN IF NOT EXISTS "published_category_id" text;
--> statement-breakpoint
UPDATE "content_posts"
SET
  "draft_category_id" = COALESCE("draft_category_id", "category_id"),
  "published_category_id" = COALESCE(
    "published_category_id",
    CASE WHEN "status" = 'published' THEN "category_id" ELSE NULL END
  )
WHERE "category_id" IS NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_post_draft_tags" (
  "post_id" text NOT NULL,
  "tag_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "content_post_draft_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_post_published_tags" (
  "post_id" text NOT NULL,
  "tag_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "content_post_published_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
INSERT INTO "content_post_draft_tags" ("post_id", "tag_id", "created_at")
SELECT "post_id", "tag_id", "created_at"
FROM "content_post_tags"
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "content_post_published_tags" ("post_id", "tag_id", "created_at")
SELECT "post_id", "tag_id", "created_at"
FROM "content_post_tags"
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "content_post_draft_tags" DROP CONSTRAINT IF EXISTS "content_post_draft_tags_post_id_content_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "content_post_draft_tags" DROP CONSTRAINT IF EXISTS "content_post_draft_tags_tag_id_content_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "content_post_published_tags" DROP CONSTRAINT IF EXISTS "content_post_published_tags_post_id_content_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "content_post_published_tags" DROP CONSTRAINT IF EXISTS "content_post_published_tags_tag_id_content_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "content_post_draft_tags" ADD CONSTRAINT "content_post_draft_tags_post_id_content_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."content_posts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_post_draft_tags" ADD CONSTRAINT "content_post_draft_tags_tag_id_content_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."content_tags"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_post_published_tags" ADD CONSTRAINT "content_post_published_tags_post_id_content_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."content_posts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_post_published_tags" ADD CONSTRAINT "content_post_published_tags_tag_id_content_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."content_tags"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_post_draft_tags_tag_idx" ON "content_post_draft_tags" USING btree ("tag_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_post_published_tags_tag_idx" ON "content_post_published_tags" USING btree ("tag_id");
--> statement-breakpoint
DROP TABLE IF EXISTS "content_post_tags";
--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_draft_category_id_content_categories_id_fk" FOREIGN KEY ("draft_category_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_published_category_id_content_categories_id_fk" FOREIGN KEY ("published_category_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_draft_cover_asset_id_assets_id_fk" FOREIGN KEY ("draft_cover_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_published_cover_asset_id_assets_id_fk" FOREIGN KEY ("published_cover_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "public_profiles" ADD CONSTRAINT "public_profiles_avatar_asset_id_assets_id_fk" FOREIGN KEY ("avatar_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_draft_cover_asset_id_assets_id_fk" FOREIGN KEY ("draft_cover_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_published_cover_asset_id_assets_id_fk" FOREIGN KEY ("published_cover_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "content_posts_draft_slug_unique" ON "content_posts" USING btree ("draft_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_posts_draft_category_idx" ON "content_posts" USING btree ("draft_category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_posts_published_category_idx" ON "content_posts" USING btree ("published_category_id");
--> statement-breakpoint
ALTER TABLE "content_posts" DROP COLUMN IF EXISTS "slug";
--> statement-breakpoint
ALTER TABLE "content_posts" DROP COLUMN IF EXISTS "title";
--> statement-breakpoint
ALTER TABLE "content_posts" DROP COLUMN IF EXISTS "excerpt";
--> statement-breakpoint
ALTER TABLE "content_posts" DROP COLUMN IF EXISTS "cover_asset_id";
--> statement-breakpoint
ALTER TABLE "content_posts" DROP COLUMN IF EXISTS "category_id";
--> statement-breakpoint
ALTER TABLE "content_preview_tokens" DROP COLUMN IF EXISTS "post_id";
--> statement-breakpoint
ALTER TABLE "content_preview_tokens" DROP COLUMN IF EXISTS "revision_id";
