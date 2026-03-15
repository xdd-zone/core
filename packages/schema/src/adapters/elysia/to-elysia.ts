import type { ZodTypeAny } from "zod";

/**
 * Elysia 直接支持 Zod Schema，此适配器仅用于统一表达依赖来源。
 */
export function toElysiaSchema<TSchema extends ZodTypeAny>(
  schema: TSchema,
): TSchema {
  return schema;
}
