import { z } from 'zod'

// ============================================================================
// Auth Types
// ============================================================================
import type { SignUpEmailBody, SignInEmailBody, SessionData, AuthSessionData } from '@xdd-zone/schema/auth'

// ============================================================================
// User Types
// ============================================================================
import type { UserIdParams, UserResponse, UserListQuery, CreateUserBody, UpdateUserBody } from '@xdd-zone/schema/user'

// ============================================================================
// RBAC Types
// ============================================================================
import type {
  RoleListQuery,
  CreateRoleBody,
  UpdateRoleBody,
  SetRoleParentBody,
  RoleIdParams,
  PermissionListQuery,
  CreatePermissionBody,
  PermissionIdParams,
  AssignRoleToUserBody,
  AssignPermissionsToRoleBody,
  ReplaceRolePermissionsBody,
  RBACUserIdParams,
  UserRoleIdParams,
  RolePermissionIdParams,
} from '@xdd-zone/schema/rbac'

// ============================================================================
// Shared Types
// ============================================================================
import type { PaginationQuery, PaginationMeta } from '@xdd-zone/schema/shared'

// ============================================================================
// Auth Schemas
// ============================================================================

/**
 * 邮箱密码注册请求 Schema
 * 必填：email（邮箱）、password（密码）、name（显示名称）
 * 选填：image（头像URL）
 */
export const SignUpEmailBodySchema = z.object({
  email: z.string().min(1, '邮箱不能为空').email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符').max(100, '密码最多100个字符'),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名最多100个字符'),
  image: z.string().url('请输入有效的头像URL').optional(),
}) as z.ZodType<SignUpEmailBody>

/**
 * 邮箱密码登录请求 Schema
 * 必填：email（邮箱）、password（密码）
 * 选填：rememberMe（记住登录状态）
 */
export const SignInEmailBodySchema = z.object({
  email: z.string().min(1, '邮箱不能为空').email('请输入有效的邮箱地址'),
  password: z.string().min(1, '密码不能为空'),
  rememberMe: z.boolean().optional(),
}) as z.ZodType<SignInEmailBody>

/**
 * 会话数据 Schema（通用）
 * 用于获取当前登录状态、/me 接口等
 * 包含：user（用户信息）、session（会话信息）、isAuthenticated（是否已登录）
 */
export const SessionDataSchema = z.object({
  user: z
    .object({
      id: z.string(),
      username: z.string().nullable(),
      name: z.string(),
      email: z.string().nullable(),
      emailVerified: z.boolean().nullable(),
      emailVerifiedAt: z.union([z.string(), z.date()]).nullable(),
      introduce: z.string().nullable(),
      image: z.string().nullable(),
      phone: z.string().nullable(),
      phoneVerified: z.boolean().nullable(),
      phoneVerifiedAt: z.union([z.string(), z.date()]).nullable(),
      lastLogin: z.union([z.string(), z.date()]).nullable(),
      lastLoginIp: z.string().nullable(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']),
      createdAt: z.union([z.string(), z.date()]),
      updatedAt: z.union([z.string(), z.date()]),
      deletedAt: z.union([z.string(), z.date()]).nullable(),
    })
    .nullable(),
  session: z
    .object({
      id: z.string(),
      userId: z.string(),
      token: z.string(),
      expiresAt: z.union([z.string(), z.date()]),
      ipAddress: z.string().nullable(),
      userAgent: z.string().nullable(),
      createdAt: z.union([z.string(), z.date()]),
    })
    .nullable(),
  isAuthenticated: z.boolean(),
}) as z.ZodType<SessionData>

/**
 * 认证会话数据 Schema（登录成功返回）
 * 登录成功后返回的用户信息和 token
 * 包含：user（用户信息）、token（JWT Token）、session（可选会话信息）
 */
export const AuthSessionDataSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string().nullable(),
    name: z.string(),
    email: z.string().nullable(),
    emailVerified: z.boolean().nullable(),
    emailVerifiedAt: z.union([z.string(), z.date()]).nullable(),
    introduce: z.string().nullable(),
    image: z.string().nullable(),
    phone: z.string().nullable(),
    phoneVerified: z.boolean().nullable(),
    phoneVerifiedAt: z.union([z.string(), z.date()]).nullable(),
    lastLogin: z.union([z.string(), z.date()]).nullable(),
    lastLoginIp: z.string().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']),
    createdAt: z.union([z.string(), z.date()]),
    updatedAt: z.union([z.string(), z.date()]),
    deletedAt: z.union([z.string(), z.date()]).nullable(),
  }),
  token: z.string().optional(),
  session: z
    .object({
      id: z.string(),
      userId: z.string(),
      token: z.string(),
      expiresAt: z.union([z.string(), z.date()]),
      ipAddress: z.string().nullable(),
      userAgent: z.string().nullable(),
      createdAt: z.union([z.string(), z.date()]),
    })
    .nullable()
    .optional(),
}) as z.ZodType<AuthSessionData>

// ============================================================================
// User Schemas
// ============================================================================

/**
 * 用户 ID 路由参数 Schema
 * 用于 /users/:id 等路径参数
 */
export const UserIdParamsSchema = z.object({
  id: z.string().min(1, '用户ID不能为空'),
}) as z.ZodType<UserIdParams>

/**
 * 用户详情响应 Schema
 * 单个用户的完整信息，用于 GET /users/:id 接口
 */
export const UserResponseSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean().nullable(),
  emailVerifiedAt: z.union([z.string(), z.date()]).nullable(),
  introduce: z.string().nullable(),
  image: z.string().nullable(),
  phone: z.string().nullable(),
  phoneVerified: z.boolean().nullable(),
  phoneVerifiedAt: z.union([z.string(), z.date()]).nullable(),
  lastLogin: z.union([z.string(), z.date()]).nullable(),
  lastLoginIp: z.string().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  deletedAt: z.union([z.string(), z.date()]).nullable(),
}) as z.ZodType<UserResponse>

/**
 * 用户列表查询 Schema
 * 支持分页、状态过滤、关键字搜索、软删除查询
 * 过滤：status（用户状态）、keyword（用户名/邮箱/昵称）、includeDeleted（含删除）
 */
export const UserListQuerySchema = z.object({
  page: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? undefined : num
    })
    .pipe(z.number().int().min(1, '页码必须大于0').optional()),
  pageSize: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? undefined : num
    })
    .pipe(z.number().int().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').optional()),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).optional(),
  keyword: z.string().optional(),
  includeDeleted: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      if (typeof val === 'boolean') return val
      return val === 'true'
    }),
}) as z.ZodType<UserListQuery>

/**
 * 创建用户请求 Schema
 * 必填：name（显示名称）
 * 选填：username（用户名）、email（邮箱）、phone（手机）、introduce（简介）、image（头像）、status（状态）
 */
export const CreateUserBodySchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符').nullable().optional(),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名最多100个字符'),
  email: z.string().email('请输入有效的邮箱地址').nullable().optional(),
  phone: z.string().max(20, '手机号最多20个字符').nullable().optional(),
  introduce: z.string().max(500, '简介最多500个字符').nullable().optional(),
  image: z.string().url('请输入有效的头像URL').nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).optional(),
}) as z.ZodType<CreateUserBody>

/**
 * 更新用户请求 Schema
 * 所有字段均为可选，用于 PATCH /users/:id 接口
 * 可更新：username、name、email、phone、introduce、image、status
 */
export const UpdateUserBodySchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符').nullable().optional(),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名最多100个字符').optional(),
  email: z.string().email('请输入有效的邮箱地址').nullable().optional(),
  phone: z.string().max(20, '手机号最多20个字符').nullable().optional(),
  introduce: z.string().max(500, '简介最多500个字符').nullable().optional(),
  image: z.string().url('请输入有效的头像URL').nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).optional(),
}) as z.ZodType<UpdateUserBody>

// ============================================================================
// RBAC Schemas
// ============================================================================

/**
 * 角色列表查询 Schema
 * 支持分页、关键字搜索、包含系统角色过滤
 */
export const RoleListQuerySchema = z.object({
  page: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? undefined : num
    })
    .pipe(z.number().int().min(1, '页码必须大于0').optional()),
  pageSize: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? undefined : num
    })
    .pipe(z.number().int().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').optional()),
  keyword: z.string().optional(),
  includeSystem: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      if (typeof val === 'boolean') return val
      return val === 'true'
    }),
}) as z.ZodType<RoleListQuery>

/**
 * 创建角色请求 Schema
 * 必填：name（角色标识）
 * 选填：displayName（显示名称）、description（描述）、parentId（父角色ID）
 */
export const CreateRoleBodySchema = z.object({
  name: z.string().min(1, '角色标识不能为空').max(50, '角色标识最多50个字符'),
  displayName: z.string().min(1, '显示名称不能为空').max(100, '显示名称最多100个字符').optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
}) as z.ZodType<CreateRoleBody>

/**
 * 更新角色请求 Schema
 * 所有字段均为可选，用于 PATCH /roles/:id
 * 可更新：displayName、description、parentId
 */
export const UpdateRoleBodySchema = z.object({
  displayName: z.string().min(1, '显示名称不能为空').max(100, '显示名称最多100个字符').optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
}) as z.ZodType<UpdateRoleBody>

/**
 * 设置父角色请求 Schema
 * 用于建立角色的层级关系，parentId 设为 null 可取消父角色
 */
export const SetRoleParentBodySchema = z.object({
  parentId: z.string().nullable(),
}) as z.ZodType<SetRoleParentBody>

/**
 * 角色 ID 路由参数 Schema
 * 用于 /roles/:id 等路径参数
 */
export const RoleIdParamsSchema = z.object({
  id: z.string().min(1, '角色ID不能为空'),
}) as z.ZodType<RoleIdParams>

/**
 * 权限列表查询 Schema
 * 支持分页、按资源类型过滤
 */
export const PermissionListQuerySchema = z.object({
  page: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? undefined : num
    })
    .pipe(z.number().int().min(1, '页码必须大于0').optional()),
  pageSize: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? undefined : num
    })
    .pipe(z.number().int().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').optional()),
  resource: z.string().optional(),
}) as z.ZodType<PermissionListQuery>

/**
 * 创建权限请求 Schema
 * 必填：resource（资源）、action（操作）
 * 选填：scope（权限范围：空/own/all）、displayName、description
 */
export const CreatePermissionBodySchema = z.object({
  resource: z.string().min(1, '资源不能为空').max(50, '资源最多50个字符'),
  action: z.string().min(1, '操作不能为空').max(50, '操作最多50个字符'),
  scope: z.enum(['', 'own', 'all']).optional(),
  displayName: z.string().min(1, '显示名称不能为空').max(100, '显示名称最多100个字符').optional(),
  description: z.string().optional(),
}) as z.ZodType<CreatePermissionBody>

/**
 * 权限 ID 路由参数 Schema
 * 用于 /permissions/:id 等路径参数
 */
export const PermissionIdParamsSchema = z.object({
  id: z.string().min(1, '权限ID不能为空'),
}) as z.ZodType<PermissionIdParams>

/**
 * 分配角色给用户请求 Schema
 * 必填：roleId（角色ID）
 */
export const AssignRoleToUserBodySchema = z.object({
  roleId: z.string().min(1, '角色ID不能为空'),
}) as z.ZodType<AssignRoleToUserBody>

/**
 * 分配权限给角色请求 Schema
 * 必填：permissionIds（权限ID数组，至少1个）
 */
export const AssignPermissionsToRoleBodySchema = z.object({
  permissionIds: z
    .array(z.string().min(1, '权限ID不能为空'))
    .min(1, '至少需要1个权限ID'),
}) as z.ZodType<AssignPermissionsToRoleBody>

/**
 * 替换角色权限请求 Schema
 * 批量替换角色的所有权限（覆盖式）
 */
export const ReplaceRolePermissionsBodySchema = z.object({
  permissionIds: z.array(z.string().min(1, '权限ID不能为空')),
}) as z.ZodType<ReplaceRolePermissionsBody>

/**
 * 用户 ID 路由参数 Schema（RBAC）
 * 用于 /rbac/users/:userId 等路径参数
 */
export const RBACUserIdParamsSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
}) as z.ZodType<RBACUserIdParams>

/**
 * 用户-角色 ID 路由参数 Schema
 * 用于 /rbac/users/:userId/roles/:roleId 等路径参数
 */
export const UserRoleIdParamsSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  roleId: z.string().min(1, '角色ID不能为空'),
}) as z.ZodType<UserRoleIdParams>

/**
 * 角色-权限 ID 路由参数 Schema
 * 用于 /roles/:id/permissions/:permissionId 等路径参数
 */
export const RolePermissionIdParamsSchema = z.object({
  id: z.string().min(1, '角色ID不能为空'),
  permissionId: z.string().min(1, '权限ID不能为空'),
}) as z.ZodType<RolePermissionIdParams>

// ============================================================================
// Shared Schemas
// ============================================================================

/**
 * 分页查询参数 Schema
 * 必填：page（页码，从1开始）、pageSize（每页数量，默认20，最大100）
 * 说明：数值自动从字符串转换，支持默认值
 */
export const PaginationQuerySchema = z
  .object({
    page: z
      .union([z.number(), z.string()])
      .optional()
      .default(1)
      .transform((val) => {
        const num = typeof val === 'string' ? parseInt(val, 10) : val
        return isNaN(num) ? 1 : num
      }),
    pageSize: z
      .union([z.number(), z.string()])
      .optional()
      .default(20)
      .transform((val) => {
        const num = typeof val === 'string' ? parseInt(val, 10) : val
        return isNaN(num) ? 20 : num
      }),
  })
  .pipe(z.object({ page: z.number().int().min(1), pageSize: z.number().int().min(1).max(100) }))

export const PaginationQueryValidator = z.object({
  page: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return 1
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? 1 : num
    })
    .pipe(z.number().int().min(1, '页码必须大于0')),
  pageSize: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return 20
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? 20 : num
    })
    .pipe(z.number().int().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100')),
}) as z.ZodType<PaginationQuery>

/**
 * 分页元数据 Schema
 * 包含当前页码、总数、每页数量、总页数、是否有上/下页等信息
 */
export const PaginationMetaSchema = z.object({
  currentPage: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
  size: z.number(),
  total: z.number(),
  totalPage: z.number(),
}) as z.ZodType<PaginationMeta>
