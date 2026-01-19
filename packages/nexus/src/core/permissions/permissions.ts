import type { PermissionString } from './permissions.types'

/**
 * RBAC 权限常量
 *
 * 格式: resource:action:scope
 *
 * 资源:
 * - user: 用户管理
 * - role: 角色管理
 * - permission: 权限管理
 *
 * 操作:
 * - create: 创建新资源
 * - read: 查看资源
 * - update: 编辑资源
 * - delete: 删除资源
 * - manage: 完全控制(创建、读取、更新、删除)
 * - assign_role: 为用户分配角色
 *
 * 作用域:
 * - own: 仅自己的资源
 * - all: 所有资源
 * - 空(无作用域): 等同于 all
 */

export const Permissions = {
  // ==================== 用户管理 ====================
  USER: {
    CREATE: 'user:create' as PermissionString,
    READ_OWN: 'user:read:own' as PermissionString,
    READ_ALL: 'user:read:all' as PermissionString,
    UPDATE_OWN: 'user:update:own' as PermissionString,
    UPDATE_ALL: 'user:update:all' as PermissionString,
    DELETE_OWN: 'user:delete:own' as PermissionString,
    DELETE_ALL: 'user:delete:all' as PermissionString,
  },

  // ==================== 角色管理 ====================
  ROLE: {
    CREATE: 'role:create' as PermissionString,
    READ: 'role:read' as PermissionString,
    READ_OWN: 'role:read:own' as PermissionString,
    READ_ALL: 'role:read:all' as PermissionString,
    UPDATE: 'role:update' as PermissionString,
    UPDATE_OWN: 'role:update:own' as PermissionString,
    UPDATE_ALL: 'role:update:all' as PermissionString,
    DELETE: 'role:delete' as PermissionString,
    DELETE_OWN: 'role:delete:own' as PermissionString,
    DELETE_ALL: 'role:delete:all' as PermissionString,
  },

  // ==================== 权限管理 ====================
  PERMISSION: {
    CREATE: 'permission:create' as PermissionString,
    READ: 'permission:read' as PermissionString,
    UPDATE: 'permission:update' as PermissionString,
    UPDATE_OWN: 'permission:update:own' as PermissionString,
    UPDATE_ALL: 'permission:update:all' as PermissionString,
    DELETE: 'permission:delete' as PermissionString,
    DELETE_OWN: 'permission:delete:own' as PermissionString,
    DELETE_ALL: 'permission:delete:all' as PermissionString,
  },

  // ==================== 用户角色管理 ====================
  USER_ROLE: {
    CREATE_OWN: 'user_role:create:own' as PermissionString,
    CREATE_ALL: 'user_role:create:all' as PermissionString,
    READ_OWN: 'user_role:read:own' as PermissionString,
    READ_ALL: 'user_role:read:all' as PermissionString,
    UPDATE_OWN: 'user_role:update:own' as PermissionString,
    UPDATE_ALL: 'user_role:update:all' as PermissionString,
    DELETE_OWN: 'user_role:delete:own' as PermissionString,
    DELETE_ALL: 'user_role:delete:all' as PermissionString,
  },

  // ==================== 用户权限查询 ====================
  USER_PERMISSION: {
    READ_OWN: 'user_permission:read:own' as PermissionString,
    READ_ALL: 'user_permission:read:all' as PermissionString,
  },

  // ==================== 角色权限管理 ====================
  ROLE_PERMISSION: {
    CREATE: 'role_permission:create' as PermissionString,
    DELETE: 'role_permission:delete' as PermissionString,
  },

  // ==================== 通配符 ====================
  ALL: '*' as PermissionString,
} as const

// Export individual permission groups for convenience
export const UserPermissions = Permissions.USER
export const RolePermissions = Permissions.ROLE
export const PermissionManagementPermissions = Permissions.PERMISSION
export const UserRolePermissions = Permissions.USER_ROLE
export const UserPermissionQueryPermissions = Permissions.USER_PERMISSION
