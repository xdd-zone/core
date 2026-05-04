import { RoleRepository } from './role.repository'
import { RbacService } from './service'
import { UserRoleRepository } from './user-role.repository'

export {
  DEFAULT_ROLE_NAME,
  FIRST_USER_ROLE_NAME,
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSION_KEYS,
  type SystemRoleName,
} from './constants'
export {
  type AssignRoleToUserBody,
  AssignRoleToUserBodySchema,
  type CurrentUserPermissions,
  CurrentUserPermissionsSchema,
  type CurrentUserRole,
  type CurrentUserRoles,
  CurrentUserRoleSchema,
  type CurrentUserRoleSource,
  CurrentUserRoleSourceSchema,
  CurrentUserRolesSchema,
  type PermissionScope,
  PermissionScopeSchema,
  type PermissionString,
  PermissionStringSchema,
  type PermissionSummary,
  PermissionSummarySchema,
  type RBACUserIdParams,
  RBACUserIdParamsSchema,
  type Role,
  type RoleIdParams,
  RoleIdParamsSchema,
  type RoleList,
  type RoleListQuery,
  RoleListQuerySchema,
  RoleListSchema,
  RoleSchema,
  type UserPermissions,
  UserPermissionsSchema,
  type UserRoleAssignment,
  UserRoleAssignmentSchema,
  type UserRoleIdParams,
  UserRoleIdParamsSchema,
  type UserRoleItem,
  UserRoleItemSchema,
  type UserRoles,
  UserRolesSchema,
} from './model'
export { RoleRepository }
export { RbacService }
export type { UserPermissionsResponse } from './types'
export { UserRoleRepository }
