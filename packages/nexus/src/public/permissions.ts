import type { SystemPermissionKey } from '../core/security/permissions/permissions'
import type { SystemRoleName } from '../core/security/permissions/role.constants'
import { matchPermission, normalizePermission, parsePermission } from '../core/security/permissions/helpers'
import {
  Permissions,
  SYSTEM_PERMISSION_DEFINITIONS,
  SYSTEM_PERMISSION_KEYS,
} from '../core/security/permissions/permissions'
import { DEFAULT_ROLE_NAME, FIRST_USER_ROLE_NAME, SYSTEM_ROLE_NAMES } from '../core/security/permissions/role.constants'

export {
  DEFAULT_ROLE_NAME,
  FIRST_USER_ROLE_NAME,
  matchPermission,
  normalizePermission,
  parsePermission,
  Permissions,
  SYSTEM_PERMISSION_DEFINITIONS,
  SYSTEM_PERMISSION_KEYS,
  SYSTEM_ROLE_NAMES,
  type SystemPermissionKey,
}

export type { Permission, PermissionScope, PermissionString } from '../core/security/permissions/permissions.types'

export type { SystemRoleName }

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
