/**
 * User 模块 Schema 定义
 * 定义用户模块的请求/响应 Schema，用于 API 验证和 OpenAPI 文档生成
 */

import { z } from 'zod'
import { createPaginatedListSchema, PaginationQuerySchema } from '@/infrastructure/database'
import { UserStatus } from '@/infrastructure/database/prisma/generated/'

/**
 * 用户状态枚举 Schema
 */
export const UserStatusSchema = z.nativeEnum(UserStatus)

/**
 * 用户 ID 参数 Schema
 * 用于路由参数验证（如 /user/:id）
 */
export const UserIdParamsSchema = z.object({
  id: z.string({
    message: '用户ID必须是字符串',
  }),
})

export type UserIdParams = z.infer<typeof UserIdParamsSchema>

/**
 * 用户响应 Schema
 * 说明：用于接口返回的用户基础信息（不包含敏感字段如密码）
 * 注意：Date 字段在响应层自动转换为 ISO 字符串
 */
export const UserResponseSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean().nullable(),
  emailVerifiedAt: z.string().or(z.date()).nullable(),
  introduce: z.string().nullable(),
  image: z.string().nullable(),
  phone: z.string().nullable(),
  phoneVerified: z.boolean().nullable(),
  phoneVerifiedAt: z.string().or(z.date()).nullable(),
  lastLogin: z.string().or(z.date()).nullable(),
  lastLoginIp: z.string().nullable(),
  status: UserStatusSchema,
  createdAt: z.string().or(z.date()), // 业务层用 Date，响应层自动转 string
  updatedAt: z.string().or(z.date()), // 业务层用 Date，响应层自动转 string
  deletedAt: z.string().or(z.date()).nullable(),
})

export type UserResponse = z.infer<typeof UserResponseSchema>

/**
 * 用户列表查询参数 Schema
 */
export const UserListQuerySchema = PaginationQuerySchema.extend({
  status: UserStatusSchema.optional(),
  keyword: z
    .string({
      message: '关键词必须是字符串',
    })
    .optional(),
  includeDeleted: z.coerce
    .boolean({
      message: 'includeDeleted 必须是布尔值',
    })
    .optional(),
})

export type UserListQuery = z.infer<typeof UserListQuerySchema>

/**
 * 用户列表响应 Schema
 */
export const UserListResponseSchema = createPaginatedListSchema(UserResponseSchema)

export type UserListResponse = z.infer<typeof UserListResponseSchema>

/**
 * 创建用户请求体 Schema
 */
export const CreateUserBodySchema = z.object({
  username: z
    .string({
      message: '用户名必须是字符串',
    })
    .min(3, '用户名至少需要3个字符')
    .max(50, '用户名最多50个字符')
    .nullable()
    .optional(),
  name: z
    .string({
      message: '姓名必须是字符串',
    })
    .min(1, '姓名不能为空')
    .max(100, '姓名最多100个字符'),
  email: z
    .string({
      message: '邮箱必须是字符串',
    })
    .email('请输入有效的邮箱地址')
    .nullable()
    .optional(),
  phone: z
    .string({
      message: '手机号必须是字符串',
    })
    .max(20, '手机号最多20个字符')
    .nullable()
    .optional(),
  introduce: z
    .string({
      message: '自我介绍必须是字符串',
    })
    .max(500, '自我介绍最多500个字符')
    .nullable()
    .optional(),
  image: z
    .string({
      message: '头像必须是字符串',
    })
    .url('请输入有效的URL地址')
    .nullable()
    .optional(),
  status: UserStatusSchema.optional(),
})

export type CreateUserBody = z.infer<typeof CreateUserBodySchema>

/**
 * 更新用户请求体 Schema
 * 说明：所有字段可选
 */
export const UpdateUserBodySchema = z.object({
  username: z
    .string({
      message: '用户名必须是字符串',
    })
    .min(3, '用户名至少需要3个字符')
    .max(50, '用户名最多50个字符')
    .nullable()
    .optional(),
  name: z
    .string({
      message: '姓名必须是字符串',
    })
    .max(100, '姓名最多100个字符')
    .optional(),
  email: z
    .string({
      message: '邮箱必须是字符串',
    })
    .email('请输入有效的邮箱地址')
    .nullable()
    .optional(),
  phone: z
    .string({
      message: '手机号必须是字符串',
    })
    .max(20, '手机号最多20个字符')
    .nullable()
    .optional(),
  introduce: z
    .string({
      message: '自我介绍必须是字符串',
    })
    .max(500, '自我介绍最多500个字符')
    .nullable()
    .optional(),
  image: z
    .string({
      message: '头像必须是字符串',
    })
    .url('请输入有效的URL地址')
    .nullable()
    .optional(),
  status: UserStatusSchema.optional(),
})

export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>
