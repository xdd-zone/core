/**
 * 固定系统角色名称。
 */
import { Permissions } from '@nexus/core/permissions/permissions'

export const SYSTEM_ROLE_NAMES = ['superAdmin', 'admin', 'user'] as const

export type SystemRoleName = (typeof SYSTEM_ROLE_NAMES)[number]

/**
 * 默认注册角色。
 */
export const DEFAULT_ROLE_NAME: SystemRoleName = 'user'

/**
 * 首个用户默认角色。
 */
export const FIRST_USER_ROLE_NAME: SystemRoleName = 'superAdmin'

/**
 * 固定角色权限映射。
 */
export const SYSTEM_ROLE_PERMISSION_KEYS: Record<SystemRoleName, readonly string[]> = {
  superAdmin: [Permissions.SYSTEM.MANAGE],
  admin: [
    Permissions.USER.READ_ALL,
    Permissions.USER.UPDATE_ALL,
    Permissions.USER.DISABLE_ALL,
    Permissions.ROLE.READ_ALL,
    Permissions.USER_ROLE.ASSIGN_ALL,
    Permissions.USER_ROLE.REVOKE_ALL,
    Permissions.USER_PERMISSION.READ_ALL,
  ],
  user: [Permissions.USER.READ_OWN, Permissions.USER.UPDATE_OWN, Permissions.USER_PERMISSION.READ_OWN],
} as const
