/**
 * RBAC 模块类型定义
 *
 * 角色权限相关类型定义，与 nexus rbac 模块保持一致
 */

import type { PaginationQuery } from '../../types/api'

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
 * 权限列表查询参数
 */
export interface PermissionListQuery extends PaginationQuery {
  /** 按资源类型过滤 */
  resource?: string
}

/**
 * 权限响应（统一格式）
 */
export type PermissionResponse = Permission

/**
 * 权限列表数据（不包含包装层）
 */
export interface PermissionListData {
  items: Permission[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 权限列表响应（统一格式）
 */
export type PermissionListResponse = PermissionListData

/**
 * 创建权限请求体
 */
export interface CreatePermissionBody {
  /** 资源类型，1-50 字符 */
  resource: string
  /** 操作类型，1-50 字符 */
  action: string
  /** 权限范围，own/all/空 */
  scope?: '' | 'own' | 'all'
  /** 显示名称 */
  displayName?: string
  /** 描述 */
  description?: string
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

/**
 * 角色列表查询参数
 */
export interface RoleListQuery extends PaginationQuery {
  /** 关键字搜索 */
  keyword?: string
  /** 是否包含系统角色 */
  includeSystem?: boolean
}

/**
 * 角色响应（统一格式）
 */
export type RoleResponse = Role

/**
 * 角色详情响应（统一格式）
 */
export interface RoleDetailResponse extends Role {
  permissions: PermissionString[]
}

/**
 * 角色列表数据（不包含包装层）
 */
export interface RoleListData {
  items: Role[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 角色列表响应（统一格式）
 */
export type RoleListResponse = RoleListData

/**
 * 创建角色请求体
 */
export interface CreateRoleBody {
  /** 角色标识，1-50 字符 */
  name: string
  /** 显示名称，1-100 字符 */
  displayName?: string
  /** 描述 */
  description?: string
  /** 父角色 ID（继承） */
  parentId?: string
}

/**
 * 更新角色请求体
 */
export interface UpdateRoleBody {
  displayName?: string | null
  description?: string | null
  parentId?: string | null
}

/**
 * 设置父角色请求体
 */
export interface SetRoleParentBody {
  /** 父角色 ID，设为 null 取消父角色 */
  parentId: string | null
}

/**
 * 为角色分配权限请求体
 */
export interface AssignPermissionsToRoleBody {
  /** 权限 ID 列表，至少 1 个 */
  permissionIds: string[]
}

/**
 * 批量替换角色权限请求体
 */
export interface ReplaceRolePermissionsBody {
  /** 权限 ID 列表 */
  permissionIds: string[]
}

/**
 * 角色权限响应（统一格式）
 */
export type RolePermissionsResponse = PermissionString[]

/**
 * 为用户分配角色请求体
 */
export interface AssignRoleToUserBody {
  /** 角色 ID */
  roleId: string
}

/**
 * 用户角色详情
 */
export interface UserRoleDetail {
  id: string
  userId: string
  roleId: string
  roleName: string
  roleDisplayName: string | null
  assignedAt: Date
}

/**
 * 用户角色列表响应（统一格式）
 */
export type UserRolesResponse = UserRoleDetail[]

/**
 * 用户权限数据（不包含包装层）
 */
export interface UserPermissionsData {
  permissions: PermissionString[]
  roles: Array<{
    id: string
    name: string
    displayName: string | null
  }>
}

/**
 * 用户权限查询响应
 */
export type UserPermissionsResponse = UserPermissionsData
