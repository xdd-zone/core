CREATE TYPE "public"."llm_provider_type" AS ENUM('openai');--> statement-breakpoint
CREATE TYPE "public"."llm_call_operation" AS ENUM('provider.test', 'content.post.meta');--> statement-breakpoint
CREATE TYPE "public"."llm_call_status" AS ENUM('success', 'error');--> statement-breakpoint
CREATE TABLE "llm_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider_type" "llm_provider_type" DEFAULT 'openai' NOT NULL,
	"base_url" text NOT NULL,
	"api_format" "llm_api_format" DEFAULT 'chat_completions' NOT NULL,
	"default_model" text NOT NULL,
	"timeout_ms" integer DEFAULT 15000 NOT NULL,
	"enabled" integer DEFAULT 0 NOT NULL,
	"api_key_ciphertext" text,
	"api_key_hint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "llm_providers" (
	"id",
	"name",
	"provider_type",
	"base_url",
	"api_format",
	"default_model",
	"timeout_ms",
	"enabled",
	"created_at",
	"updated_at"
)
SELECT
	'llm_provider_default',
	'默认 OpenAI 兼容服务',
	'openai',
	COALESCE(MAX("base_url"), 'https://api.openai.com/v1'),
	COALESCE(MAX("api_format"), 'chat_completions'),
	COALESCE(MAX("model"), 'gpt-5-mini'),
	COALESCE(MAX("timeout_ms"), 15000),
	0,
	now(),
	now()
FROM "llm_use_case_configs";
--> statement-breakpoint
DROP INDEX "llm_use_case_configs_use_case_unique";--> statement-breakpoint
ALTER TABLE "llm_use_case_configs" ADD COLUMN "provider_id" text;--> statement-breakpoint
UPDATE "llm_use_case_configs" SET "provider_id" = 'llm_provider_default';--> statement-breakpoint
ALTER TABLE "llm_use_case_configs" DROP COLUMN "provider";--> statement-breakpoint
ALTER TABLE "llm_use_case_configs" DROP COLUMN "api_format";--> statement-breakpoint
ALTER TABLE "llm_use_case_configs" DROP COLUMN "base_url";--> statement-breakpoint
ALTER TABLE "llm_use_case_configs" DROP COLUMN "timeout_ms";--> statement-breakpoint
ALTER TABLE "llm_use_case_configs" ADD CONSTRAINT "llm_use_case_configs_provider_id_llm_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."llm_providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "llm_use_case_configs_use_case_unique" ON "llm_use_case_configs" USING btree ("use_case");--> statement-breakpoint
CREATE TABLE "llm_call_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"operation" "llm_call_operation" NOT NULL,
	"use_case" "llm_use_case",
	"provider_id" text,
	"provider_name" text NOT NULL,
	"provider_type" "llm_provider_type" NOT NULL,
	"provider_base_url" text NOT NULL,
	"provider_api_format" "llm_api_format" NOT NULL,
	"model" text NOT NULL,
	"status" "llm_call_status" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_ms" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"error_type" text,
	"error_code" text,
	"error_status" integer,
	"error_message" text,
	"error_details" jsonb,
	"request_id" text,
	"actor_id" text,
	"source_type" text,
	"source_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "llm_call_logs" ADD CONSTRAINT "llm_call_logs_provider_id_llm_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."llm_providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "llm_call_logs_provider_id_idx" ON "llm_call_logs" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "llm_call_logs_request_id_idx" ON "llm_call_logs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "llm_call_logs_started_at_idx" ON "llm_call_logs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "llm_call_logs_status_idx" ON "llm_call_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "llm_call_logs_use_case_idx" ON "llm_call_logs" USING btree ("use_case");--> statement-breakpoint
DROP TYPE "public"."llm_provider";
