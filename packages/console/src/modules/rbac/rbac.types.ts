/**
 * 角色。
 */
export interface Role {
  id: string
  name: string
  displayName: string | null
  description: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 分页角色列表。
 */
export interface RoleList {
  items: Role[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 角色列表查询参数。
 */
export interface RoleListQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export type PermissionScope = 'own' | 'all' | null

/**
 * 权限展示项。
 */
export interface PermissionSummary {
  key: string
  resource: string
  action: string
  scope: PermissionScope
  displayName: string
  description: string
}

/**
 * 用户权限。
 */
export interface UserPermissions {
  permissions: PermissionSummary[]
}

/**
 * 当前用户权限（包含角色信息）。
 */
export interface CurrentUserPermissions extends UserPermissions {
  roles: {
    id: string
    name: string
    displayName: string | null
  }[]
}

/**
 * 当前用户角色。
 */
export interface CurrentUserRoles {
  roles: {
    id: string
    name: string
    displayName: string | null
    description: string | null
    isSystem: boolean
    source: 'system' | 'manual'
    assignedBy: string | null
    assignedAt: string
    permissions: PermissionSummary[]
  }[]
}

/**
 * 用户角色项。
 */
export interface UserRoleItem {
  id: string
  roleId: string
  roleName: string
  roleDisplayName: string | null
  assignedBy: string | null
  assignedAt: string
}

/**
 * 用户角色列表。
 */
export type UserRoles = UserRoleItem[]

/**
 * 为用户分配角色请求体。
 */
export interface AssignRoleToUserBody {
  roleId: string
}
