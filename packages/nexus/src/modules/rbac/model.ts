import { SYSTEM_PERMISSION_KEYS } from '@nexus/core/security/permissions'
import { createPaginatedListSchema, DateTimeSchema, intFromQuery } from '@nexus/shared/schema'
import { z } from 'zod'

export const PermissionStringSchema = z.enum(SYSTEM_PERMISSION_KEYS)
export type PermissionString = z.infer<typeof PermissionStringSchema>

export const PermissionScopeSchema = z.enum(['own', 'all'])
export type PermissionScope = z.infer<typeof PermissionScopeSchema>

export const PermissionSummarySchema = z.object({
  key: PermissionStringSchema,
  resource: z.string(),
  action: z.string(),
  scope: PermissionScopeSchema.nullable(),
  displayName: z.string(),
  description: z.string(),
})

export type PermissionSummary = z.infer<typeof PermissionSummarySchema>

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
})

export type Role = z.infer<typeof RoleSchema>

export const AssignRoleToUserBodySchema = z.object({
  roleId: z.string().min(1, '角色 ID 不能为空'),
})

export type AssignRoleToUserBody = z.infer<typeof AssignRoleToUserBodySchema>

export const RBACUserIdParamsSchema = z.object({
  userId: z.string().min(1, '用户 ID 不能为空'),
})

export type RBACUserIdParams = z.infer<typeof RBACUserIdParamsSchema>

export const RoleIdParamsSchema = z.object({
  id: z.string().min(1, '角色 ID 不能为空'),
})

export type RoleIdParams = z.infer<typeof RoleIdParamsSchema>

export const RoleListQuerySchema = z.object({
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于 0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于 0').max(100, '每页数量不能超过 100').optional(),
  ),
  keyword: z.string().optional(),
})

export type RoleListQuery = z.infer<typeof RoleListQuerySchema>

export const RoleListSchema = createPaginatedListSchema(RoleSchema)
export type RoleList = z.infer<typeof RoleListSchema>

export const UserPermissionsSchema = z.object({
  permissions: z.array(PermissionSummarySchema),
})

export type UserPermissions = z.infer<typeof UserPermissionsSchema>

export const CurrentUserPermissionsSchema = UserPermissionsSchema.extend({
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      displayName: z.string().nullable(),
    }),
  ),
})

export type CurrentUserPermissions = z.infer<typeof CurrentUserPermissionsSchema>

export const CurrentUserRoleSourceSchema = z.enum(['system', 'manual'])
export type CurrentUserRoleSource = z.infer<typeof CurrentUserRoleSourceSchema>

export const CurrentUserRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  source: CurrentUserRoleSourceSchema,
  assignedBy: z.string().nullable(),
  assignedAt: DateTimeSchema,
  permissions: z.array(PermissionSummarySchema),
})

export type CurrentUserRole = z.infer<typeof CurrentUserRoleSchema>

export const CurrentUserRolesSchema = z.object({
  roles: z.array(CurrentUserRoleSchema),
})

export type CurrentUserRoles = z.infer<typeof CurrentUserRolesSchema>

export const UserRoleAssignmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string(),
  assignedBy: z.string().nullable(),
  assignedAt: DateTimeSchema,
  role: RoleSchema,
})

export type UserRoleAssignment = z.infer<typeof UserRoleAssignmentSchema>

export const UserRoleIdParamsSchema = z.object({
  userId: z.string().min(1, '用户 ID 不能为空'),
  roleId: z.string().min(1, '角色 ID 不能为空'),
})

export type UserRoleIdParams = z.infer<typeof UserRoleIdParamsSchema>

export const UserRoleItemSchema = z.object({
  id: z.string(),
  roleId: z.string(),
  roleName: z.string(),
  roleDisplayName: z.string().nullable(),
  assignedBy: z.string().nullable(),
  assignedAt: DateTimeSchema,
})

export type UserRoleItem = z.infer<typeof UserRoleItemSchema>

export const UserRolesSchema = z.array(UserRoleItemSchema)
export type UserRoles = z.infer<typeof UserRolesSchema>
