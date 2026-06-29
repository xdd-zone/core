CREATE TYPE "public"."llm_api_format" AS ENUM('chat_completions', 'responses');--> statement-breakpoint
CREATE TYPE "public"."llm_provider" AS ENUM('none', 'openai');--> statement-breakpoint
CREATE TYPE "public"."llm_use_case" AS ENUM('content.post.meta');--> statement-breakpoint
CREATE TABLE "llm_use_case_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"use_case" "llm_use_case" NOT NULL,
	"enabled" integer DEFAULT 0 NOT NULL,
	"provider" "llm_provider" DEFAULT 'none' NOT NULL,
	"model" text NOT NULL,
	"api_format" "llm_api_format" DEFAULT 'chat_completions' NOT NULL,
	"base_url" text,
	"timeout_ms" integer NOT NULL,
	"temperature" numeric(3, 2),
	"max_output_tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "llm_use_case_configs_use_case_unique" ON "llm_use_case_configs" USING btree ("use_case");