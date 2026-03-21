import { z } from 'zod'
import { booleanish, createPaginatedListSchema, DateTimeSchema, intFromQuery } from '@/shared/schema'

export const PermissionScopeSchema = z.enum(['', 'own', 'all'])
export type PermissionScope = z.infer<typeof PermissionScopeSchema>

export const PermissionStringSchema = z.string()
export type PermissionString = z.infer<typeof PermissionStringSchema>

export const PermissionSchema = z.object({
  id: z.string(),
  resource: z.string(),
  action: z.string(),
  scope: PermissionScopeSchema.optional(),
  displayName: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
})

export type Permission = z.infer<typeof PermissionSchema>

export const RoleBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
  description: z.string().nullable(),
  parentId: z.string().nullable(),
  level: z.number(),
  isSystem: z.boolean(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
})

export type RoleBase = z.infer<typeof RoleBaseSchema>

export const RoleParentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
})

export type RoleParentSummary = z.infer<typeof RoleParentSummarySchema>

export const RoleSchema = RoleBaseSchema.extend({
  parent: RoleParentSummarySchema.nullable().optional(),
})

export type Role = z.infer<typeof RoleSchema>

export const RoleDetailParentSchema = RoleBaseSchema
export type RoleDetailParent = z.infer<typeof RoleDetailParentSchema>

export const RoleDetailSchema = RoleBaseSchema.extend({
  parent: RoleDetailParentSchema.nullable().optional(),
  permissions: z.array(PermissionStringSchema),
})

export type RoleDetail = z.infer<typeof RoleDetailSchema>

export const PermissionSummarySchema = z.object({
  id: z.string(),
  resource: z.string(),
  action: z.string(),
  scope: z.string().nullable(),
  displayName: z.string().nullable(),
})

export type PermissionSummary = z.infer<typeof PermissionSummarySchema>

export const AssignPermissionsToRoleBodySchema = z.object({
  permissionIds: z.array(z.string().min(1, '权限ID不能为空')).min(1, '至少需要1个权限ID'),
})

export type AssignPermissionsToRoleBody = z.infer<typeof AssignPermissionsToRoleBodySchema>

export const AssignRoleToUserBodySchema = z.object({
  roleId: z.string().min(1, '角色ID不能为空'),
})

export type AssignRoleToUserBody = z.infer<typeof AssignRoleToUserBodySchema>

export const CreatePermissionBodySchema = z.object({
  resource: z.string().min(1, '资源不能为空').max(50, '资源最多50个字符'),
  action: z.string().min(1, '操作不能为空').max(50, '操作最多50个字符'),
  scope: PermissionScopeSchema.optional(),
  displayName: z.string().min(1, '显示名称不能为空').max(100, '显示名称最多100个字符').optional(),
  description: z.string().optional(),
})

export type CreatePermissionBody = z.infer<typeof CreatePermissionBodySchema>

export const CreateRoleBodySchema = z.object({
  name: z.string().min(1, '角色标识不能为空').max(50, '角色标识最多50个字符'),
  displayName: z.string().min(1, '显示名称不能为空').max(100, '显示名称最多100个字符').optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
})

export type CreateRoleBody = z.infer<typeof CreateRoleBodySchema>

export const OperationResultSchema = z.object({
  success: z.boolean(),
  count: z.number().optional(),
})

export type OperationResult = z.infer<typeof OperationResultSchema>

export const PermissionIdParamsSchema = z.object({
  id: z.string().min(1, '权限ID不能为空'),
})

export type PermissionIdParams = z.infer<typeof PermissionIdParamsSchema>

export const PermissionListQuerySchema = z.object({
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').optional(),
  ),
  resource: z.string().optional(),
})

export type PermissionListQuery = z.infer<typeof PermissionListQuerySchema>

export const PermissionListSchema = createPaginatedListSchema(PermissionSchema)
export type PermissionList = z.infer<typeof PermissionListSchema>

export const RBACUserIdParamsSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
})

export type RBACUserIdParams = z.infer<typeof RBACUserIdParamsSchema>

export const ReplaceRolePermissionsBodySchema = z.object({
  permissionIds: z.array(z.string().min(1, '权限ID不能为空')),
})

export type ReplaceRolePermissionsBody = z.infer<typeof ReplaceRolePermissionsBodySchema>

export const RoleChildrenSchema = z.array(RoleSchema)
export type RoleChildren = z.infer<typeof RoleChildrenSchema>

export const RoleIdParamsSchema = z.object({
  id: z.string().min(1, '角色ID不能为空'),
})

export type RoleIdParams = z.infer<typeof RoleIdParamsSchema>

export const RoleListQuerySchema = z.object({
  page: intFromQuery('页码必须是整数').pipe(z.number().min(1, '页码必须大于0').optional()),
  pageSize: intFromQuery('每页数量必须是整数').pipe(
    z.number().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').optional(),
  ),
  keyword: z.string().optional(),
  includeSystem: booleanish(),
})

export type RoleListQuery = z.infer<typeof RoleListQuerySchema>

export const RoleListSchema = createPaginatedListSchema(RoleSchema)
export type RoleList = z.infer<typeof RoleListSchema>

export const RolePermissionIdParamsSchema = z.object({
  id: z.string().min(1, '角色ID不能为空'),
  permissionId: z.string().min(1, '权限ID不能为空'),
})

export type RolePermissionIdParams = z.infer<typeof RolePermissionIdParamsSchema>

export const RolePermissionsSchema = z.array(PermissionSummarySchema)
export type RolePermissions = z.infer<typeof RolePermissionsSchema>

export const SetRoleParentBodySchema = z.object({
  parentId: z.string().nullable(),
})

export type SetRoleParentBody = z.infer<typeof SetRoleParentBodySchema>

export const UpdateRoleBodySchema = z.object({
  displayName: z.string().min(1, '显示名称不能为空').max(100, '显示名称最多100个字符').optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
})

export type UpdateRoleBody = z.infer<typeof UpdateRoleBodySchema>

export const UserPermissionsSchema = z.object({
  permissions: z.array(PermissionStringSchema),
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

export const CurrentUserRolesSchema = z.object({
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      displayName: z.string().nullable(),
      assignedAt: DateTimeSchema,
    }),
  ),
})

export type CurrentUserRoles = z.infer<typeof CurrentUserRolesSchema>

export const UserRoleAssignmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string(),
  assignedAt: DateTimeSchema,
  role: RoleSchema,
})

export type UserRoleAssignment = z.infer<typeof UserRoleAssignmentSchema>

export const UserRoleIdParamsSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  roleId: z.string().min(1, '角色ID不能为空'),
})

export type UserRoleIdParams = z.infer<typeof UserRoleIdParamsSchema>

export const UserRoleItemSchema = z.object({
  id: z.string(),
  roleId: z.string(),
  roleName: z.string(),
  roleDisplayName: z.string().nullable(),
  assignedAt: DateTimeSchema,
})

export type UserRoleItem = z.infer<typeof UserRoleItemSchema>

export const UserRolesSchema = z.array(UserRoleItemSchema)
export type UserRoles = z.infer<typeof UserRolesSchema>
