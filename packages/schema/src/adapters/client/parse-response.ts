import type { ZodTypeAny } from "zod";

/**
 * 在客户端边界解析服务端响应。
 */
export async function parseResponse<TSchema extends ZodTypeAny>(
  schema: TSchema,
  input: unknown,
): Promise<TSchema["_output"]> {
  return await schema.parseAsync(input);
}
