import { z } from "zod";
import { UserStatusSchema } from "../auth/auth.schema";
import { PaginationMetaSchema } from "../shared/pagination";

// 透传类型，详见 @xdd-zone/schema/auth 中的定义
export type { UserStatus } from "../auth/auth.schema";

/**
 * 用户 ID 路由参数
 * 用于 /users/:id 等路径参数
 */
export const UserIdParamsSchema = z.object({
  id: z.string(),
});

export type UserIdParams = z.infer<typeof UserIdParamsSchema>;

/**
 * 用户详情响应
 * 单个用户的完整信息，用于 GET /users/:id 接口
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
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  deletedAt: z.string().or(z.date()).nullable(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * 用户列表查询
 * 支持分页、状态过滤、关键字搜索、软删除查询
 * 过滤：status（用户状态）、keyword（用户名/邮箱/昵称）、includeDeleted（含删除）
 */
export const UserListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  status: UserStatusSchema.optional(),
  keyword: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional(),
});

export type UserListQuery = z.infer<typeof UserListQuerySchema>;

/**
 * 用户列表响应
 * 返回用户数组和分页信息，用于 GET /users 接口
 */
export const UserListResponseSchema = z.object({
  list: z.array(UserResponseSchema),
  pagination: PaginationMetaSchema,
});

export type UserListResponse = z.infer<typeof UserListResponseSchema>;

/**
 * 创建用户请求
 * 必填：name（显示名称）
 * 选填：username（用户名）、email（邮箱）、phone（手机）、introduce（简介）、image（头像）、status（状态）
 */
export const CreateUserBodySchema = z.object({
  username: z.string().min(3).max(50).nullable().optional(),
  name: z.string().min(1).max(100),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  introduce: z.string().max(500).nullable().optional(),
  image: z.string().url().nullable().optional(),
  status: UserStatusSchema.optional(),
});

export type CreateUserBody = z.infer<typeof CreateUserBodySchema>;

/**
 * 更新用户请求
 * 所有字段均为可选，用于 PATCH /users/:id 接口
 * 可更新：username、name、email、phone、introduce、image、status
 */
export const UpdateUserBodySchema = z.object({
  username: z.string().min(3).max(50).nullable().optional(),
  name: z.string().max(100).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  introduce: z.string().max(500).nullable().optional(),
  image: z.string().url().nullable().optional(),
  status: UserStatusSchema.optional(),
});

export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>;
