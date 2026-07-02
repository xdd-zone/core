ALTER TABLE "public_profiles" ADD COLUMN "location" text;
--> statement-breakpoint
ALTER TABLE "public_profiles" ADD COLUMN "available_for_work" boolean DEFAULT false NOT NULL;
