CREATE TYPE "public"."access_status" AS ENUM('active', 'disabled');--> statement-breakpoint
ALTER TABLE "application_auth_methods" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."access_status";--> statement-breakpoint
ALTER TABLE "application_auth_methods" ALTER COLUMN "status" SET DATA TYPE "public"."access_status" USING "status"::"public"."access_status";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."access_status";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."access_status" USING "status"::"public"."access_status";--> statement-breakpoint
ALTER TABLE "user_role_bindings" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."access_status";--> statement-breakpoint
ALTER TABLE "user_role_bindings" ALTER COLUMN "status" SET DATA TYPE "public"."access_status" USING "status"::"public"."access_status";