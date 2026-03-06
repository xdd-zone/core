import { z } from 'zod'
import {
  RoleListQuerySchema,
  PermissionListQuerySchema,
  CreateRoleBodySchema,
  UpdateRoleBodySchema,
  SetRoleParentBodySchema,
  RoleIdParamsSchema,
  CreatePermissionBodySchema,
  PermissionIdParamsSchema,
  AssignRoleToUserBodySchema,
  AssignPermissionsToRoleBodySchema,
  ReplaceRolePermissionsBodySchema,
  RBACUserIdParamsSchema,
  UserRoleIdParamsSchema,
  RolePermissionIdParamsSchema,
} from '@/shared/validator'

export {
  RoleListQuerySchema,
  PermissionListQuerySchema,
  CreateRoleBodySchema,
  UpdateRoleBodySchema,
  SetRoleParentBodySchema,
  RoleIdParamsSchema,
  CreatePermissionBodySchema,
  PermissionIdParamsSchema,
  AssignRoleToUserBodySchema,
  AssignPermissionsToRoleBodySchema,
  ReplaceRolePermissionsBodySchema,
  RBACUserIdParamsSchema,
  UserRoleIdParamsSchema,
  RolePermissionIdParamsSchema,
}

export type RoleListQuery = z.infer<typeof RoleListQuerySchema>
export type PermissionListQuery = z.infer<typeof PermissionListQuerySchema>
export type CreateRoleBody = z.infer<typeof CreateRoleBodySchema>
export type UpdateRoleBody = z.infer<typeof UpdateRoleBodySchema>
export type SetRoleParentBody = z.infer<typeof SetRoleParentBodySchema>
export type RoleIdParams = z.infer<typeof RoleIdParamsSchema>
export type CreatePermissionBody = z.infer<typeof CreatePermissionBodySchema>
export type PermissionIdParams = z.infer<typeof PermissionIdParamsSchema>
export type AssignRoleToUserBody = z.infer<typeof AssignRoleToUserBodySchema>
export type AssignPermissionsToRoleBody = z.infer<typeof AssignPermissionsToRoleBodySchema>
export type ReplaceRolePermissionsBody = z.infer<typeof ReplaceRolePermissionsBodySchema>
export type RBACUserIdParams = z.infer<typeof RBACUserIdParamsSchema>
export type UserRoleIdParams = z.infer<typeof UserRoleIdParamsSchema>
export type RolePermissionIdParams = z.infer<typeof RolePermissionIdParamsSchema>
