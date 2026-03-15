/**
 * RBAC 模块类型定义
 */

export type {
  AssignPermissionsToRoleBody,
  AssignRoleToUserBody,
  CreatePermissionBody,
  CreateRoleBody,
  CurrentUserPermissions,
  CurrentUserRoles,
  OperationResult,
  Permission,
  PermissionIdParams,
  PermissionList,
  PermissionListQuery,
  PermissionSummary,
  RBACUserIdParams,
  ReplaceRolePermissionsBody,
  Role,
  RoleChildren,
  RoleDetail,
  RoleIdParams,
  RoleList,
  RoleListQuery,
  RolePermissionIdParams,
  RolePermissions,
  SetRoleParentBody,
  UpdateRoleBody,
  UserPermissions,
  UserRoleAssignment,
  UserRoleIdParams,
  UserRoleItem,
  UserRoles,
} from '@xdd-zone/schema/contracts/rbac'

export type { PermissionScope, PermissionString, RoleWithPermissions } from '@xdd-zone/schema/domains/rbac'
