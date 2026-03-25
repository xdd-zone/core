import { z } from 'zod'

/**
 * 用户状态。
 */
export const UserStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'BANNED'])
export type UserStatus = z.infer<typeof UserStatusSchema>

export const ApiErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.null(),
  errorCode: z.string().optional(),
  details: z.unknown().optional(),
})

export type ApiError = z.infer<typeof ApiErrorSchema>

/**
 * 创建分页列表 Schema。
 */
export function createPaginatedListSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  })
}

export interface PaginatedList<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
