/**
 * 分页相关 Schema
 */
import { z } from 'zod'

/**
 * 分页查询参数 Schema
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
})

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

/**
 * 分页元数据 Schema
 */
export const PaginationMetaSchema = z.object({
  currentPage: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
  size: z.number(),
  total: z.number(),
  totalPage: z.number(),
})

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

/**
 * 创建分页列表响应 Schema
 * @param itemSchema 列表项的 Schema
 */
export function createPaginatedListSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    list: z.array(itemSchema),
    pagination: PaginationMetaSchema,
  })
}
