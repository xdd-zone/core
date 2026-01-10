import { z } from 'zod'

/**
 * RBAC 模块验证 Schema
 *
 * 说明：
 * - 定义所有 API 请求和响应的 Zod 验证 Schema
 * - 用于路由参数、查询参数、请求体验证
 * - 自动生成 TypeScript 类型和 OpenAPI 文档
 *
 * @module rbac.model
 */

// ===== 角色相关 Schema =====

/**
 * 角色列表查询参数 Schema
 *
 * @description
 * 用于获取角色列表时的查询参数验证
 *
 * @property {number} page - 页码（默认：1）
 * @property {number} pageSize - 每页数量（默认：20，最大：100）
 * @property {string} [keyword] - 搜索关键字（可选，匹配名称或显示名称）
 * @property {boolean} [includeSystem] - 是否包含系统角色（可选）
 *
 * @example
 * ```ts
 * // GET /api/rbac/roles?page=1&pageSize=20&keyword=admin&includeSystem=false
 * ```
 */
export const RoleListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
  includeSystem: z.coerce.boolean().optional(),
})

/**
 * 创建角色请求体 Schema
 *
 * @description
 * 用于创建新角色时的请求体验证
 *
 * @property {string} name - 角色名称（1-50字符，唯一标识）
 * @property {string} [displayName] - 角色显示名称（1-100字符，可选）
 * @property {string} [description] - 角色描述（可选）
 * @property {string} [parentId] - 父角色 ID（可选）
 *
 * @example
 * ```ts
 * // POST /api/rbac/roles
 * {
 *   "name": "editor",
 *   "displayName": "编辑",
 *   "description": "内容编辑权限",
 *   "parentId": "admin_role_id"
 * }
 * ```
 */
export const CreateRoleBodySchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
})

/**
 * 更新角色请求体 Schema
 *
 * @description
 * 用于更新角色信息时的请求体验证
 *
 * @property {string} [displayName] - 角色显示名称（1-100字符，可选）
 * @property {string} [description] - 角色描述（可选）
 * @property {string | null} [parentId] - 父角色 ID（可选，设置为 null 可取消父角色）
 *
 * @example
 * ```ts
 * // PATCH /api/rbac/roles/:id
 * {
 *   "displayName": "新显示名称",
 *   "description": "更新后的描述",
 *   "parentId": null
 * }
 * ```
 */
export const UpdateRoleBodySchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
})

/**
 * 设置角色父角色请求体 Schema
 *
 * @description
 * 用于设置或取消角色的父角色
 *
 * @property {string | null} parentId - 父角色 ID（设置为 null 可取消父角色）
 *
 * @example
 * ```ts
 * // PATCH /api/rbac/roles/:id/parent
 * {
 *   "parentId": "admin_role_id"
 * }
 *
 * // 取消父角色
 * {
 *   "parentId": null
 * }
 * ```
 */
export const SetRoleParentBodySchema = z.object({
  parentId: z.string().nullable(),
})

/**
 * 角色 ID 路径参数 Schema
 *
 * @description
 * 用于角色相关的路径参数验证
 *
 * @property {string} id - 角色 ID
 *
 * @example
 * ```ts
 * // GET /api/rbac/roles/:id
 * // PATCH /api/rbac/roles/:id
 * // DELETE /api/rbac/roles/:id
 * ```
 */
export const RoleIdParamsSchema = z.object({
  id: z.string(),
})

// ===== 权限相关 Schema =====

/**
 * 权限列表查询参数 Schema
 *
 * @description
 * 用于获取权限列表时的查询参数验证
 *
 * @property {number} page - 页码（默认：1）
 * @property {number} pageSize - 每页数量（默认：20，最大：100）
 * @property {string} [resource] - 资源类型过滤（可选）
 *
 * @example
 * ```ts
 * // GET /api/rbac/permissions?page=1&pageSize=20&resource=user
 * ```
 */
export const PermissionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  resource: z.string().optional(),
})

/**
 * 创建权限请求体 Schema
 *
 * @description
 * 用于创建自定义权限时的请求体验证
 *
 * @property {string} resource - 资源类型（1-50字符）
 * @property {string} action - 操作类型（1-50字符）
 * @property {'' | 'own' | 'all'} [scope] - 权限范围（可选）
 * @property {string} [displayName] - 权限显示名称（1-100字符，可选）
 * @property {string} [description] - 权限描述（可选）
 *
 * @example
 * ```ts
 * // POST /api/rbac/permissions
 * {
 *   "resource": "article",
 *   "action": "publish",
 *   "scope": "own",
 *   "displayName": "发布自己的文章",
 *   "description": "允许用户发布自己创建的文章"
 * }
 * ```
 */
export const CreatePermissionBodySchema = z.object({
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  scope: z.enum(['', 'own', 'all']).optional(),
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
})

/**
 * 权限 ID 路径参数 Schema
 *
 * @description
 * 用于权限相关的路径参数验证
 *
 * @property {string} id - 权限 ID
 *
 * @example
 * ```ts
 * // GET /api/rbac/permissions/:id
 * ```
 */
export const PermissionIdParamsSchema = z.object({
  id: z.string(),
})

// ===== 分配相关 Schema =====

/**
 * 为用户分配角色请求体 Schema
 * @description 用于为用户分配角色时的请求体验证
 */
export const AssignRoleToUserBodySchema = z.object({
  roleId: z.string(),
})

/**
 * 为角色分配权限请求体 Schema
 *
 * @description
 * 用于为角色分配权限时的请求体验证
 *
 * @property {string[]} permissionIds - 权限 ID 数组（至少1个）
 *
 * @example
 * ```ts
 * // POST /api/rbac/roles/:id/permissions
 * {
 *   "permissionIds": ["perm1", "perm2", "perm3"]
 * }
 * ```
 */
export const AssignPermissionsToRoleBodySchema = z.object({
  permissionIds: z.array(z.string()).min(1),
})

/**
 * 更新用户角色请求体 Schema
 * @description 用于更新用户角色时的请求体验证（预留扩展）
 */
export const UpdateUserRoleBodySchema = z.object({})

/**
 * 批量替换角色权限请求体 Schema
 *
 * @description
 * 用于完全替换角色权限列表时的请求体验证
 *
 * @property {string[]} permissionIds - 新的权限 ID 数组（可空）
 *
 * @example
 * ```ts
 * // PATCH /api/rbac/roles/:id/permissions
 * {
 *   "permissionIds": ["perm1", "perm2"]
 * }
 * ```
 */
export const ReplaceRolePermissionsBodySchema = z.object({
  permissionIds: z.array(z.string()),
})

// ===== 用户相关 Schema =====

/**
 * 用户 ID 路径参数 Schema
 *
 * @description
 * 用于用户相关的路径参数验证
 *
 * @property {string} userId - 用户 ID
 *
 * @example
 * ```ts
 * // GET /api/rbac/users/:userId/roles
 * // POST /api/rbac/users/:userId/roles
 * ```
 */
export const UserIdParamsSchema = z.object({
  userId: z.string(),
})

/**
 * 用户角色 ID 路径参数 Schema
 *
 * @description
 * 用于用户角色相关的路径参数验证
 *
 * @property {string} userId - 用户 ID
 * @property {string} roleId - 角色 ID
 *
 * @example
 * ```ts
 * // DELETE /api/rbac/users/:userId/roles/:roleId
 * // PATCH /api/rbac/users/:userId/roles/:roleId
 * ```
 */
export const UserRoleIdParamsSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
})

/**
 * 角色权限 ID 路径参数 Schema
 *
 * @description
 * 用于角色权限相关的路径参数验证
 *
 * @property {string} id - 角色 ID
 * @property {string} permissionId - 权限 ID
 *
 * @example
 * ```ts
 * // DELETE /api/rbac/roles/:id/permissions/:permissionId
 * ```
 */
export const RolePermissionIdParamsSchema = z.object({
  id: z.string(),
  permissionId: z.string(),
})
