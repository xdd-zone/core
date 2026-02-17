import { z } from 'zod'
import {
  RoleListQuerySchema as RoleListQuerySchemaBase,
  PermissionListQuerySchema as PermissionListQuerySchemaBase,
} from '@xdd-zone/schema/rbac'

export {
  RoleListQuerySchema as RoleListQuerySchema,
  PermissionListQuerySchema as PermissionListQuerySchema,
} from '@xdd-zone/schema/rbac'

export type RoleListQuery = z.infer<typeof RoleListQuerySchemaBase>
export type PermissionListQuery = z.infer<typeof PermissionListQuerySchemaBase>

import {
  CreateRoleBodySchema as CreateRoleBodySchemaBase,
  UpdateRoleBodySchema as UpdateRoleBodySchemaBase,
  SetRoleParentBodySchema as SetRoleParentBodySchemaBase,
  RoleIdParamsSchema as RoleIdParamsSchemaBase,
  CreatePermissionBodySchema as CreatePermissionBodySchemaBase,
  PermissionIdParamsSchema as PermissionIdParamsSchemaBase,
  AssignRoleToUserBodySchema as AssignRoleToUserBodySchemaBase,
  AssignPermissionsToRoleBodySchema as AssignPermissionsToRoleBodySchemaBase,
  ReplaceRolePermissionsBodySchema as ReplaceRolePermissionsBodySchemaBase,
  RBACUserIdParamsSchema as RBACUserIdParamsSchemaBase,
  UserRoleIdParamsSchema as UserRoleIdParamsSchemaBase,
  RolePermissionIdParamsSchema as RolePermissionIdParamsSchemaBase,
} from '@xdd-zone/schema/rbac'

export const CreateRoleBodySchema = CreateRoleBodySchemaBase.extend({
  name: z.string({ message: '角色名称必须是字符串' }).min(1, '角色名称不能为空').max(50, '角色名称最多50个字符'),
  displayName: z
    .string({ message: '显示名称必须是字符串' })
    .min(1, '显示名称不能为空')
    .max(100, '显示名称最多100个字符')
    .optional(),
  description: z.string({ message: '描述必须是字符串' }).optional(),
  parentId: z.string({ message: '父角色ID必须是字符串' }).optional(),
})
export type CreateRoleBody = z.infer<typeof CreateRoleBodySchema>

export const UpdateRoleBodySchema = UpdateRoleBodySchemaBase.extend({
  displayName: z
    .string({ message: '显示名称必须是字符串' })
    .min(1, '显示名称不能为空')
    .max(100, '显示名称最多100个字符')
    .optional(),
  description: z.string({ message: '描述必须是字符串' }).optional(),
  parentId: z.string({ message: '父角色ID必须是字符串' }).nullable().optional(),
})
export type UpdateRoleBody = z.infer<typeof UpdateRoleBodySchema>

export const SetRoleParentBodySchema = SetRoleParentBodySchemaBase.extend({
  parentId: z.string({ message: '父角色ID必须是字符串' }).nullable(),
})
export type SetRoleParentBody = z.infer<typeof SetRoleParentBodySchema>

export const RoleIdParamsSchema = RoleIdParamsSchemaBase.extend({
  id: z.string({ message: '角色ID必须是字符串' }),
})
export type RoleIdParams = z.infer<typeof RoleIdParamsSchema>

export const CreatePermissionBodySchema = CreatePermissionBodySchemaBase.extend({
  resource: z.string({ message: '资源名称必须是字符串' }).min(1, '资源名称不能为空').max(50, '资源名称最多50个字符'),
  action: z.string({ message: '操作名称必须是字符串' }).min(1, '操作名称不能为空').max(50, '操作名称最多50个字符'),
  displayName: z
    .string({ message: '显示名称必须是字符串' })
    .min(1, '显示名称不能为空')
    .max(100, '显示名称最多100个字符')
    .optional(),
  description: z.string({ message: '描述必须是字符串' }).optional(),
})
export type CreatePermissionBody = z.infer<typeof CreatePermissionBodySchema>

export const PermissionIdParamsSchema = PermissionIdParamsSchemaBase.extend({
  id: z.string({ message: '权限ID必须是字符串' }),
})
export type PermissionIdParams = z.infer<typeof PermissionIdParamsSchema>

export const AssignRoleToUserBodySchema = AssignRoleToUserBodySchemaBase.extend({
  roleId: z.string({ message: '角色ID必须是字符串' }),
})
export type AssignRoleToUserBody = z.infer<typeof AssignRoleToUserBodySchema>

export const AssignPermissionsToRoleBodySchema = AssignPermissionsToRoleBodySchemaBase.extend({
  permissionIds: z.array(z.string({ message: '权限ID必须是字符串' })).min(1, '至少需要一个权限ID'),
})
export type AssignPermissionsToRoleBody = z.infer<typeof AssignPermissionsToRoleBodySchema>

export const ReplaceRolePermissionsBodySchema = ReplaceRolePermissionsBodySchemaBase.extend({
  permissionIds: z.array(z.string({ message: '权限ID必须是字符串' })),
})
export type ReplaceRolePermissionsBody = z.infer<typeof ReplaceRolePermissionsBodySchema>

export const RBACUserIdParamsSchema = RBACUserIdParamsSchemaBase.extend({
  userId: z.string({ message: '用户ID必须是字符串' }),
})
export type RBACUserIdParams = z.infer<typeof RBACUserIdParamsSchema>

export const UserRoleIdParamsSchema = UserRoleIdParamsSchemaBase.extend({
  userId: z.string({ message: '用户ID必须是字符串' }),
  roleId: z.string({ message: '角色ID必须是字符串' }),
})
export type UserRoleIdParams = z.infer<typeof UserRoleIdParamsSchema>

export const RolePermissionIdParamsSchema = RolePermissionIdParamsSchemaBase.extend({
  id: z.string({ message: '角色ID必须是字符串' }),
  permissionId: z.string({ message: '权限ID必须是字符串' }),
})
export type RolePermissionIdParams = z.infer<typeof RolePermissionIdParamsSchema>
