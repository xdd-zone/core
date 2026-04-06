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
  admin: [
    Permissions.USER.READ_ALL,
    Permissions.USER.UPDATE_ALL,
    Permissions.USER.DISABLE_ALL,
    Permissions.ROLE.READ_ALL,
    Permissions.USER_ROLE.ASSIGN_ALL,
    Permissions.USER_ROLE.REVOKE_ALL,
    Permissions.USER_PERMISSION.READ_ALL,
    Permissions.POST.READ_ALL,
    Permissions.POST.WRITE_ALL,
    Permissions.POST.PUBLISH_ALL,
    Permissions.SITE_CONFIG.READ,
    Permissions.SITE_CONFIG.WRITE,
    Permissions.MEDIA.READ_ALL,
    Permissions.MEDIA.WRITE_ALL,
    Permissions.COMMENT.READ_ALL,
    Permissions.COMMENT.MODERATE_ALL,
  ],
  user: [Permissions.USER.READ_OWN, Permissions.USER.UPDATE_OWN, Permissions.USER_PERMISSION.READ_OWN],
} as const
