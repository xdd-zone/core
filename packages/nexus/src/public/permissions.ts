import type { SystemPermissionKey } from '../core/security/permissions/permissions'
import type { Permission, PermissionScope, PermissionString } from '../core/security/permissions/permissions.types'
import type { SystemRoleName } from '../core/security/permissions/role.constants'
import { matchPermission, normalizePermission, parsePermission } from '../core/security/permissions/helpers'
import {
  CommentPermissions,
  MediaPermissions,
  Permissions,
  PostPermissions,
  RolePermissions,
  SiteConfigPermissions,
  SYSTEM_PERMISSION_DEFINITIONS,
  SYSTEM_PERMISSION_KEYS,
  SystemPermissions,
  UserPermissionQueryPermissions,
  UserPermissions,
  UserRolePermissions,
} from '../core/security/permissions/permissions'
import { DEFAULT_ROLE_NAME, FIRST_USER_ROLE_NAME, SYSTEM_ROLE_NAMES } from '../core/security/permissions/role.constants'
import { SYSTEM_ROLE_PERMISSION_KEYS } from '../modules/rbac/constants'

export {
  CommentPermissions,
  DEFAULT_ROLE_NAME,
  FIRST_USER_ROLE_NAME,
  matchPermission,
  MediaPermissions,
  normalizePermission,
  parsePermission,
  Permissions,
  PostPermissions,
  RolePermissions,
  SiteConfigPermissions,
  SYSTEM_PERMISSION_DEFINITIONS,
  SYSTEM_PERMISSION_KEYS,
  SYSTEM_ROLE_NAMES,
  type SystemPermissionKey,
  SystemPermissions,
  UserPermissionQueryPermissions,
  UserPermissions,
  UserRolePermissions,
}

export { SYSTEM_ROLE_PERMISSION_KEYS }

export type { Permission, PermissionScope, PermissionString, SystemRoleName }
