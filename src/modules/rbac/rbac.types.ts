import type { PermissionString } from '@/core/permissions'

/**
 * RBAC 模块类型定义
 *
 * 说明：
 * - 定义模块特定的 TypeScript 类型
 * - 包含角色、权限、用户角色关联等业务类型
 * - 与 core/permissions 共享基础权限类型
 *
 * @module rbac.types
 */

/**
 * 角色及其权限详情
 *
 * 说明：
 * - 包含角色的完整信息
 * - permissions 字段为权限字符串数组（如 ['user:create', 'user:read']）
 *
 * @interface
 *
 * @property {string} id - 角色 ID
 * @property {string} name - 角色名称（唯一标识）
 * @property {string | null} displayName - 角色显示名称
 * @property {string | null} description - 角色描述
 * @property {string | null} parentId - 父角色 ID
 * @property {number} level - 角色层级（0 为顶级）
 * @property {boolean} isSystem - 是否为系统内置角色
 * @property {PermissionString[]} permissions - 权限字符串数组
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 *
 * @example
 * ```ts
 * const role: RoleWithPermissions = {
 *   id: 'role_123',
 *   name: 'editor',
 *   displayName: '编辑',
 *   description: '内容编辑权限',
 *   parentId: null,
 *   level: 0,
 *   isSystem: false,
 *   permissions: ['article:create', 'article:update:own'],
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * }
 * ```
 */
export interface RoleWithPermissions {
  id: string
  name: string
  displayName: string | null
  description: string | null
  parentId: string | null
  level: number
  isSystem: boolean
  permissions: PermissionString[]
  createdAt: Date
  updatedAt: Date
}

/**
 * 用户角色关联详情
 * @interface
 */
export interface UserRoleWithDetails {
  id: string
  userId: string
  roleId: string
  roleName: string
  roleDisplayName: string | null
  assignedAt: Date
}

/**
 * 按资源分组的权限列表
 *
 * 说明：
 * - 用于前端权限树展示
 * - 权限按资源类型分组
 *
 * @interface
 *
 * @property {string} resource - 资源类型（如 'user', 'article'）
 * @property {Array<object>} permissions - 该资源的权限列表
 * @property {string} permissions[].id - 权限 ID
 * @property {string} permissions[].action - 操作类型
 * @property {string | null} permissions[].scope - 权限范围
 * @property {string | null} permissions[].displayName - 权限显示名称
 *
 * @example
 * ```ts
 * const grouped: PermissionGrouped = {
 *   resource: 'user',
 *   permissions: [
 *     { id: '1', action: 'create', scope: null, displayName: '创建用户' },
 *     { id: '2', action: 'read', scope: null, displayName: '查看用户' }
 *   ]
 * }
 * ```
 */
export interface PermissionGrouped {
  resource: string
  permissions: Array<{
    id: string
    action: string
    scope: string | null
    displayName: string | null
  }>
}

/**
 * 用户权限查询响应
 * @interface
 */
export interface UserPermissionsResponse {
  permissions: PermissionString[]
  roles: Array<{
    id: string
    name: string
    displayName: string | null
  }>
}
