import type { PermissionString } from './permissions.types'

/**
 * 系统权限常量。
 */
export const Permissions = {
  USER: {
    READ_OWN: 'user:read:own' as PermissionString,
    READ_ALL: 'user:read:all' as PermissionString,
    UPDATE_OWN: 'user:update:own' as PermissionString,
    UPDATE_ALL: 'user:update:all' as PermissionString,
    DISABLE_ALL: 'user:disable:all' as PermissionString,
  },
  ROLE: {
    READ_ALL: 'role:read:all' as PermissionString,
  },
  USER_ROLE: {
    ASSIGN_ALL: 'user_role:assign:all' as PermissionString,
    REVOKE_ALL: 'user_role:revoke:all' as PermissionString,
  },
  USER_PERMISSION: {
    READ_OWN: 'user_permission:read:own' as PermissionString,
    READ_ALL: 'user_permission:read:all' as PermissionString,
  },
  SYSTEM: {
    MANAGE: 'system:manage' as PermissionString,
  },
} as const

export const SYSTEM_PERMISSION_KEYS = [
  Permissions.USER.READ_OWN,
  Permissions.USER.UPDATE_OWN,
  Permissions.USER.READ_ALL,
  Permissions.USER.UPDATE_ALL,
  Permissions.USER.DISABLE_ALL,
  Permissions.ROLE.READ_ALL,
  Permissions.USER_ROLE.ASSIGN_ALL,
  Permissions.USER_ROLE.REVOKE_ALL,
  Permissions.USER_PERMISSION.READ_OWN,
  Permissions.USER_PERMISSION.READ_ALL,
  Permissions.SYSTEM.MANAGE,
] as const

export type SystemPermissionKey = (typeof SYSTEM_PERMISSION_KEYS)[number]

export const SYSTEM_PERMISSION_DEFINITIONS: ReadonlyArray<{
  key: SystemPermissionKey
  displayName: string
  description: string
}> = [
  {
    key: Permissions.USER.READ_OWN,
    displayName: '查看自己的资料',
    description: '允许查看当前登录用户的基础资料。',
  },
  {
    key: Permissions.USER.UPDATE_OWN,
    displayName: '更新自己的资料',
    description: '允许更新当前登录用户的基础资料。',
  },
  {
    key: Permissions.USER.READ_ALL,
    displayName: '查看全部用户',
    description: '允许后台管理员查看用户列表和用户详情。',
  },
  {
    key: Permissions.USER.UPDATE_ALL,
    displayName: '更新全部用户资料',
    description: '允许后台管理员更新用户基础资料。',
  },
  {
    key: Permissions.USER.DISABLE_ALL,
    displayName: '管理用户状态',
    description: '允许后台管理员启用、停用或封禁用户。',
  },
  {
    key: Permissions.ROLE.READ_ALL,
    displayName: '查看角色列表',
    description: '允许查看固定系统角色与用户角色分配结果。',
  },
  {
    key: Permissions.USER_ROLE.ASSIGN_ALL,
    displayName: '分配用户角色',
    description: '允许为用户分配固定系统角色。',
  },
  {
    key: Permissions.USER_ROLE.REVOKE_ALL,
    displayName: '移除用户角色',
    description: '允许移除用户已分配的固定系统角色。',
  },
  {
    key: Permissions.USER_PERMISSION.READ_OWN,
    displayName: '查看自己的权限',
    description: '允许查看当前登录用户的有效权限。',
  },
  {
    key: Permissions.USER_PERMISSION.READ_ALL,
    displayName: '查看用户权限',
    description: '允许查看指定用户的有效权限。',
  },
  {
    key: Permissions.SYSTEM.MANAGE,
    displayName: '管理系统底座',
    description: '平台级全局管理能力，由超级管理员稳定持有。',
  },
] as const

export const UserPermissions = Permissions.USER
export const RolePermissions = Permissions.ROLE
export const UserRolePermissions = Permissions.USER_ROLE
export const UserPermissionQueryPermissions = Permissions.USER_PERMISSION
export const SystemPermissions = Permissions.SYSTEM
