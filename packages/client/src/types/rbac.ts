/**
 * RBAC 模块类型定义
 *
 * 角色权限相关类型定义
 * 基础类型从 @xdd-zone/schema/rbac 导入，client 特有类型手动定义
 */

import type {
  RoleListQuery,
  CreateRoleBody,
  UpdateRoleBody,
  SetRoleParentBody,
  RoleIdParams,
  PermissionListQuery,
  CreatePermissionBody,
  PermissionIdParams,
  AssignRoleToUserBody,
  AssignPermissionsToRoleBody,
  ReplaceRolePermissionsBody,
  RBACUserIdParams,
  UserRoleIdParams,
  RolePermissionIdParams,
} from '@xdd-zone/schema/rbac'

// 从 schema 重新导出基础类型
export type {
  RoleListQuery,
  CreateRoleBody,
  UpdateRoleBody,
  SetRoleParentBody,
  RoleIdParams,
  PermissionListQuery,
  CreatePermissionBody,
  PermissionIdParams,
  AssignRoleToUserBody,
  AssignPermissionsToRoleBody,
  ReplaceRolePermissionsBody,
  RBACUserIdParams,
  UserRoleIdParams,
  RolePermissionIdParams,
}

// ========== Client 特有类型 ==========

/**
 * 权限字符串格式
 *
 * 格式: resource:action:scope
 * 例如: user:create:own, article:read:all, user:delete
 */
export type PermissionString = `${string}:${string}:${'own' | 'all' | ''}` | `${string}:${string}` | '*'

/**
 * 权限定义
 */
export interface Permission {
  id: string
  resource: string
  action: string
  scope?: 'own' | 'all' | ''
  displayName: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * 角色定义
 */
export interface Role {
  id: string
  name: string
  displayName: string | null
  description: string | null
  parentId: string | null
  level: number
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * 角色及其权限详情
 */
export interface RoleWithPermissions {
  id: string
  name: string
  displayName: string | null
  description: string | null
  parentId: string | null
  level: number
  isSystem: boolean
  permissions: PermissionString[]
  createdAt: Date
  updatedAt: Date
}

// 响应包装类型
export type PermissionResponse = Permission

export interface PermissionListData {
  items: Permission[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type PermissionListResponse = PermissionListData

export type RoleResponse = Role

export interface RoleDetailResponse extends Role {
  permissions: PermissionString[]
}

export interface RoleListData {
  items: Role[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type RoleListResponse = RoleListData

export type RolePermissionsResponse = PermissionString[]

export interface UserRoleDetail {
  id: string
  userId: string
  roleId: string
  roleName: string
  roleDisplayName: string | null
  assignedAt: Date
}

export type UserRolesResponse = UserRoleDetail[]

export interface UserPermissionsData {
  permissions: PermissionString[]
  roles: Array<{
    id: string
    name: string
    displayName: string | null
  }>
}

export type UserPermissionsResponse = UserPermissionsData

export interface RoleChildrenItem {
  id: string
  name: string
  displayName: string | null
  description: string | null
  parentId: string | null
  level: number
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

export type RoleChildrenResponse = RoleChildrenItem[]
