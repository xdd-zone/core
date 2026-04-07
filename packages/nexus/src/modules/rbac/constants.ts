/**
 * 固定系统角色名称。
 */
import type { SystemRoleName } from '@nexus/core/security/permissions/role.constants'
import { Permissions } from '@nexus/core/security/permissions/permissions'

export {
  DEFAULT_ROLE_NAME,
  FIRST_USER_ROLE_NAME,
  SYSTEM_ROLE_NAMES,
} from '@nexus/core/security/permissions/role.constants'
export type { SystemRoleName }

/**
 * 固定角色权限映射。
 */
export const SYSTEM_ROLE_PERMISSION_KEYS: Record<SystemRoleName, readonly string[]> = {
  superAdmin: [Permissions.SYSTEM.MANAGE],
  user: [Permissions.USER.READ_OWN, Permissions.USER.UPDATE_OWN, Permissions.USER_PERMISSION.READ_OWN],
} as const
