import { createPaginatedListSchema, DateTimeSchema, intFromQuery, UserStatusSchema } from '@nexus/shared/schema'
import { z } from 'zod'

export type UserStatus = z.infer<typeof UserStatusSchema>

export const UserSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean().nullable(),
  emailVerifiedAt: DateTimeSchema.nullable(),
  introduce: z.string().nullable(),
  image: z.string().nullable(),
  phone: z.string().nullable(),
  phoneVerified: z.boolean().nullable(),
  phoneVerifiedAt: DateTimeSchema.nullable(),
  lastLogin: DateTimeSchema.nullable(),
  lastLoginIp: z.string().nullable(),
  status: UserStatusSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.nullable(),
})

export type User = z.infer<typeof UserSchema>

export const UpdateMyProfileBodySchema = z.object({
  username: z.string().min(3, '用户名至少 3 个字符').max(50, '用户名最多 50 个字符').nullable().optional(),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名最多 100 个字符').optional(),
  email: z.string().email('请输入有效的邮箱地址').nullable().optional(),
  phone: z.string().max(20, '手机号最多 20 个字符').nullable().optional(),
  introduce: z.string().max(500, '简介最多 500 个字符').nullable().optional(),
  image: z.string().url('请输入有效的头像 URL').nullable().optional(),
})

export type UpdateMyProfileBody = z.infer<typeof UpdateMyProfileBodySchema>

export const UpdateUserBodySchema = UpdateMyProfileBodySchema
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>

export const UpdateUserStatusBodySchema = z.object({
  status: UserStatusSchema,
})

export type UpdateUserStatusBody = z.infer<typeof UpdateUserStatusBodySchema>

export const UserIdParamsSchema = z.object({
  id: z.string().min(1, '用户 ID 不能为空'),
})

export type UserIdParams = z.infer<typeof UserIdParamsSchema>

export const UserListQuerySchema = z.object({
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于 0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于 0').max(100, '每页数量不能超过 100').optional(),
  ),
  status: UserStatusSchema.optional(),
  keyword: z.string().optional(),
})

export type UserListQuery = z.infer<typeof UserListQuerySchema>

export const UserListSchema = createPaginatedListSchema(UserSchema)
export type UserList = z.infer<typeof UserListSchema>
