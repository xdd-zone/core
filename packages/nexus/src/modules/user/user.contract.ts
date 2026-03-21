import { z } from 'zod'
import { booleanish, createPaginatedListSchema, DateTimeSchema, intFromQuery } from '@/shared/schema'

export const UserStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'BANNED'])
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

export const CreateUserBodySchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符').nullable().optional(),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名最多100个字符'),
  email: z.string().email('请输入有效的邮箱地址').nullable().optional(),
  phone: z.string().max(20, '手机号最多20个字符').nullable().optional(),
  introduce: z.string().max(500, '简介最多500个字符').nullable().optional(),
  image: z.string().url('请输入有效的头像URL').nullable().optional(),
  status: UserStatusSchema.optional(),
})

export type CreateUserBody = z.infer<typeof CreateUserBodySchema>

export const UpdateUserBodySchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符').nullable().optional(),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名最多100个字符').optional(),
  email: z.string().email('请输入有效的邮箱地址').nullable().optional(),
  phone: z.string().max(20, '手机号最多20个字符').nullable().optional(),
  introduce: z.string().max(500, '简介最多500个字符').nullable().optional(),
  image: z.string().url('请输入有效的头像URL').nullable().optional(),
  status: UserStatusSchema.optional(),
})

export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>

export const UserIdParamsSchema = z.object({
  id: z.string().min(1, '用户ID不能为空'),
})

export type UserIdParams = z.infer<typeof UserIdParamsSchema>

export const UserListQuerySchema = z.object({
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').optional(),
  ),
  status: UserStatusSchema.optional(),
  keyword: z.string().optional(),
  includeDeleted: booleanish(),
})

export type UserListQuery = z.infer<typeof UserListQuerySchema>

export const UserListSchema = createPaginatedListSchema(UserSchema)
export type UserList = z.infer<typeof UserListSchema>
