import { z } from 'zod'
import {
  UserIdParamsSchema,
  UserResponseSchema,
  UserListQuerySchema,
  CreateUserBodySchema,
  UpdateUserBodySchema,
} from '@/shared/validator'

/**
 * 用户状态枚举 Schema
 * 用于标识用户的当前状态：ACTIVE（活跃）、INACTIVE（非活跃）、BANNED（已封禁）
 */
export const UserStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'BANNED'])

export type UserStatus = z.infer<typeof UserStatusSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
export type UserListQuery = z.infer<typeof UserListQuerySchema>
export type CreateUserBody = z.infer<typeof CreateUserBodySchema>
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>

export type UserIdParams = z.infer<typeof UserIdParamsSchema>

// Re-export schemas for route usage
export { UserIdParamsSchema, UserResponseSchema, UserListQuerySchema, CreateUserBodySchema, UpdateUserBodySchema }

/**
 * 用户列表响应 Schema
 * 包含用户数据列表和分页元信息
 */
export const UserListResponseSchema = z.object({
  list: z.array(UserResponseSchema),
  pagination: z.object({
    currentPage: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
    size: z.number(),
    total: z.number(),
    totalPage: z.number(),
  }),
})

export type UserListResponse = z.infer<typeof UserListResponseSchema>
