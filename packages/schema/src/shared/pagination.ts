import { z } from "zod";

/**
 * 分页查询参数
 * 必填：page（页码，从1开始）、pageSize（每页数量，默认20，最大100）
 * 说明：数值自动从字符串转换，支持默认值
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * 分页元数据
 * 包含当前页码、总数、每页数量、总页数、是否有上/下页等信息
 */
export const PaginationMetaSchema = z.object({
  currentPage: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
  size: z.number(),
  total: z.number(),
  totalPage: z.number(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * 创建分页列表 Schema 工厂函数
 * @param itemSchema - 列表项的 Zod Schema
 * @returns 包含 list（数组）和 pagination（分页信息）的 Schema
 */
export function createPaginatedListSchema<T extends z.ZodTypeAny>(
  itemSchema: T,
) {
  return z.object({
    list: z.array(itemSchema),
    pagination: PaginationMetaSchema,
  });
}

/**
 * 分页列表 Schema（柯里化版本）
 * 用法：const UserListSchema = PaginatedListSchema(UserSchema)
 */
export const PaginatedListSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  createPaginatedListSchema(itemSchema);

export type PaginatedList<T> = {
  list: T[];
  pagination: PaginationMeta;
};

/**
 * API 统一响应 Schema 工厂函数
 * @param dataSchema - 响应数据的 Zod Schema
 * @returns 包含 code（状态码）、message（消息）、data（业务数据）的 Schema
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number(),
    message: z.string(),
    data: dataSchema,
  });

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};
