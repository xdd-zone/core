import type { SystemPermissionKey } from '../core/permissions/permissions'
import type { Permission, PermissionScope, PermissionString } from '../core/permissions/permissions.types'
import type { SystemRoleName } from '../core/permissions/role.constants'
import { matchPermission, normalizePermission, parsePermission } from '../core/permissions/helpers'
import {
  Permissions,
  RolePermissions,
  SYSTEM_PERMISSION_DEFINITIONS,
  SYSTEM_PERMISSION_KEYS,
  SystemPermissions,
  UserPermissionQueryPermissions,
  UserPermissions,
  UserRolePermissions,
} from '../core/permissions/permissions'
import { DEFAULT_ROLE_NAME, FIRST_USER_ROLE_NAME, SYSTEM_ROLE_NAMES } from '../core/permissions/role.constants'
import { CommentPermissions } from '../modules/comment/permissions'
import { MediaPermissions } from '../modules/media/permissions'
import { BUSINESS_PERMISSION_DEFINITIONS } from '../modules/permissions'
import { PostPermissions } from '../modules/post/permissions'
import { SYSTEM_ROLE_PERMISSION_KEYS } from '../modules/rbac/constants'
import { SiteConfigPermissions } from '../modules/site-config/permissions'

const PERMISSION_DEFINITIONS = [...SYSTEM_PERMISSION_DEFINITIONS, ...BUSINESS_PERMISSION_DEFINITIONS] as const
const PERMISSION_KEYS = PERMISSION_DEFINITIONS.map((definition) => definition.key)

const ALL_PERMISSION_DEFINITIONS = PERMISSION_DEFINITIONS
const ALL_PERMISSION_KEYS = PERMISSION_KEYS

export {
  ALL_PERMISSION_DEFINITIONS,
  ALL_PERMISSION_KEYS,
  CommentPermissions,
  DEFAULT_ROLE_NAME,
  FIRST_USER_ROLE_NAME,
  matchPermission,
  MediaPermissions,
  normalizePermission,
  parsePermission,
  PERMISSION_DEFINITIONS,
  PERMISSION_KEYS,
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
