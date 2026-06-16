CREATE TYPE "public"."content_post_format" AS ENUM('markdown', 'mdx');--> statement-breakpoint
CREATE TYPE "public"."content_post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "content_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"storage_path" text NOT NULL,
	"url" text,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"alt" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_post_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"revision_no" integer NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"format" "content_post_format" NOT NULL,
	"source" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"format" "content_post_format" NOT NULL,
	"status" "content_post_status" DEFAULT 'draft' NOT NULL,
	"cover_asset_id" text,
	"draft_revision_id" text,
	"published_revision_id" text,
	"created_by" text,
	"updated_by" text,
	"published_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_preview_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"post_id" text NOT NULL,
	"revision_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_post_revisions" ADD CONSTRAINT "content_post_revisions_post_id_content_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."content_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_post_revisions" ADD CONSTRAINT "content_post_revisions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_cover_asset_id_content_assets_id_fk" FOREIGN KEY ("cover_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_published_by_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_preview_tokens" ADD CONSTRAINT "content_preview_tokens_post_id_content_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."content_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_preview_tokens" ADD CONSTRAINT "content_preview_tokens_revision_id_content_post_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."content_post_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_preview_tokens" ADD CONSTRAINT "content_preview_tokens_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_post_revisions_post_revision_unique" ON "content_post_revisions" USING btree ("post_id","revision_no");--> statement-breakpoint
CREATE INDEX "content_post_revisions_post_idx" ON "content_post_revisions" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_posts_slug_unique" ON "content_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_posts_status_idx" ON "content_posts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "content_preview_tokens_token_hash_unique" ON "content_preview_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "content_preview_tokens_post_idx" ON "content_preview_tokens" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "content_preview_tokens_expires_at_idx" ON "content_preview_tokens" USING btree ("expires_at");
