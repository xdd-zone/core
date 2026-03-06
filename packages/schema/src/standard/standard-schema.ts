import type { StandardSchemaV1 } from "@standard-schema/spec";

// Re-export StandardSchemaV1 types for use in other modules
export type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Standard Schema 工具函数
 * 用于创建符合 Standard Schema 规范的对象
 */

export interface StandardSchemaOptions<Input, Output> {
  validate: (value: unknown) => StandardSchemaV1.Result<Output>;
  types?: {
    input: Input;
    output: Output;
  };
}

/**
 * 创建 Standard Schema 对象
 * @param options - Schema 配置选项
 * @returns 符合 Standard Schema 规范的对象
 */
export function createSchema<Input, Output>(
  options: StandardSchemaOptions<Input, Output>,
): StandardSchemaV1<Input, Output> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<Output>;
    types?: {
      input: Input;
      output: Output;
    };
  };
} {
  return {
    "~standard": {
      version: 1,
      vendor: "xdd-zone",
      validate: options.validate,
      types: options.types
        ? {
            input: {} as Input,
            output: {} as Output,
          }
        : undefined,
    },
  } as never;
}

/**
 * 创建只包含验证函数的简化 Schema
 * @param validate - 验证函数
 * @returns 符合 Standard Schema 规范的对象
 */
export function createSimpleSchema<Output>(
  validate: (value: unknown) => StandardSchemaV1.Result<Output>,
): StandardSchemaV1<unknown, Output> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<Output>;
    types?: undefined;
  };
} {
  return {
    "~standard": {
      version: 1,
      vendor: "xdd-zone",
      validate,
    },
  } as never;
}

/**
 * 从现有的 Standard Schema 对象提取验证函数
 * @param schema - Standard Schema 对象
 * @returns 验证函数
 */
export function getValidate<T>(
  schema: StandardSchemaV1<unknown, T>,
): (value: unknown) => StandardSchemaV1.Result<T> {
  return (
    (schema as any)["~standard"]?.validate ??
    (() => ({ success: false as const, errors: [] }))
  );
}

/**
 * 检查对象是否为有效的 Standard Schema
 * @param value - 待检查的对象
 * @returns 是否为有效的 Standard Schema
 */
export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const standard = obj["~standard"];
  if (typeof standard !== "object" || standard === null) {
    return false;
  }
  const s = standard as Record<string, unknown>;
  return s.version === 1 && typeof s.validate === "function";
}
