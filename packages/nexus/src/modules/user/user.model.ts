import { z } from 'zod'
import {
  UserIdParamsSchema as UserIdParamsSchemaBase,
  UserListQuerySchema as UserListQuerySchemaBase,
  CreateUserBodySchema as CreateUserBodySchemaBase,
  UpdateUserBodySchema as UpdateUserBodySchemaBase,
  UserResponseSchema as UserResponseSchemaBase,
  UserListResponseSchema as UserListResponseSchemaBase,
} from '@xdd-zone/schema/user'

import { UserStatusSchema as UserStatusSchemaBase } from '@xdd-zone/schema/auth'

export { UserStatusSchema } from '@xdd-zone/schema/auth'
export { UserResponseSchema, UserListResponseSchema } from '@xdd-zone/schema/user'

// 透传类型别名供内部使用
const UserStatusSchema = UserStatusSchemaBase
const UserResponseSchema = UserResponseSchemaBase
const UserListResponseSchema = UserListResponseSchemaBase

export type UserStatus = z.infer<typeof UserStatusSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
export type UserListResponse = z.infer<typeof UserListResponseSchema>

export const UserIdParamsSchema = UserIdParamsSchemaBase.extend({
  id: z.string({
    message: '用户ID必须是字符串',
  }),
})
export type UserIdParams = z.infer<typeof UserIdParamsSchema>

export const UserListQuerySchema = UserListQuerySchemaBase.extend({
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

export const CreateUserBodySchema = CreateUserBodySchemaBase.extend({
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

export const UpdateUserBodySchema = UpdateUserBodySchemaBase.extend({
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
