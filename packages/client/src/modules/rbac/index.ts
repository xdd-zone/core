/**
 * RBAC 模块访问器
 *
 * 基于 Eden Treaty 风格的树形语法 API，提供角色权限管理功能
 */

import type { RequestFn } from '../../core/request'
import type { ApiResult, XDDResponse } from '../../core/types'
import type {
  PermissionListQuery,
  PermissionListResponse,
  PermissionResponse,
  CreatePermissionBody,
  RoleListQuery,
  RoleListResponse,
  RoleDetailResponse,
  RoleResponse,
  CreateRoleBody,
  UpdateRoleBody,
  AssignPermissionsToRoleBody,
  ReplaceRolePermissionsBody,
  RolePermissionsResponse,
  SetRoleParentBody,
  AssignRoleToUserBody,
  UserRolesResponse,
  UserPermissionsResponse,
} from '../../types/rbac'

/**
 * API 响应类型简写
 */
type Res<T> = Promise<XDDResponse<ApiResult<T>>>

/**
 * Roles 子模块
 */
interface RoleIdAccessor {
  get(): Res<RoleDetailResponse>
  patch(body: UpdateRoleBody): Res<RoleResponse>
  delete(): Res<null>
  permissions: {
    get(): Res<RolePermissionsResponse>
    post(body: AssignPermissionsToRoleBody): Res<RolePermissionsResponse>
    put(body: ReplaceRolePermissionsBody): Res<RolePermissionsResponse>
    delete(): Res<RolePermissionsResponse>
  }
  parent: {
    get(): Res<RoleResponse>
    patch(body: SetRoleParentBody): Res<RoleResponse>
  }
}

interface RolesAccessors {
  list: {
    get(query?: RoleListQuery): Res<RoleListResponse>
  }
  create(body: CreateRoleBody): Res<RoleResponse>
  (id: string): RoleIdAccessor
  get(id: string): Res<RoleDetailResponse>
  update(id: string, body: UpdateRoleBody): Res<RoleResponse>
  delete(id: string): Res<null>
}

// Permissions 子模块
interface PermissionIdAccessor {
  get(): Res<PermissionResponse>
  delete(): Res<null>
}

interface PermissionsAccessors {
  list: {
    get(query?: PermissionListQuery): Res<PermissionListResponse>
  }
  create(body: CreatePermissionBody): Res<PermissionResponse>
  (id: string): PermissionIdAccessor
  get(id: string): Res<PermissionResponse>
  delete(id: string): Res<null>
}

// Users 子模块 (rbac/users/:userId/roles)
interface UserRolesIdAccessor {
  get(): Res<UserRolesResponse>
  post(body: AssignRoleToUserBody): Res<UserRolesResponse>
  delete(roleId: string): Res<null>
}

// 当前用户权限访问器
interface UserMeAccessor {
  permissions: {
    get(): Res<UserPermissionsResponse>
  }
  roles: {
    get(): Res<UserRolesResponse>
  }
}

interface RbacUsersAccessors {
  (userId: string): UserRolesIdAccessor
  get(userId: string): Res<UserRolesResponse>
  assign(userId: string, body: AssignRoleToUserBody): Res<UserRolesResponse>
  remove(userId: string, roleId: string): Res<null>
  me: UserMeAccessor
}

// RBAC 完整访问器
export interface RbacAccessors {
  roles: RolesAccessors
  permissions: PermissionsAccessors
  users: RbacUsersAccessors
  getUserPermissions(userId: string): Res<UserPermissionsResponse>
}

/**
 * 创建 RBAC 模块访问器
 *
 * @param request - 统一请求函数
 * @returns RBAC 访问器实例
 */
export function createRbacAccessor(request: RequestFn): RbacAccessors {
  // Roles
  const rolesListGet = (query?: RoleListQuery) =>
    request<ApiResult<RoleListResponse>>('GET', 'rbac/roles', {
      params: query as Record<string, unknown>,
    })

  const rolesCreate = (body: CreateRoleBody) =>
    request<ApiResult<RoleResponse>>('POST', 'rbac/roles', { body: JSON.stringify(body) })

  const rolesGet = (id: string) => request<ApiResult<RoleDetailResponse>>('GET', `rbac/roles/${id}`)

  const rolesUpdate = (id: string, body: UpdateRoleBody) =>
    request<ApiResult<RoleResponse>>('PATCH', `rbac/roles/${id}`, { body: JSON.stringify(body) })

  const rolesDelete = (id: string) => request<ApiResult<null>>('DELETE', `rbac/roles/${id}`)

  const rolesAccessor: RolesAccessors = Object.assign(
    (id: string) => ({
      get: () => rolesGet(id),
      patch: (body: UpdateRoleBody) => rolesUpdate(id, body),
      delete: () => rolesDelete(id),
      permissions: {
        get: () => request<ApiResult<RolePermissionsResponse>>('GET', `rbac/roles/${id}/permissions`),
        post: (body: AssignPermissionsToRoleBody) =>
          request<ApiResult<RolePermissionsResponse>>('POST', `rbac/roles/${id}/permissions`, {
            body: JSON.stringify(body),
          }),
        put: (body: ReplaceRolePermissionsBody) =>
          request<ApiResult<RolePermissionsResponse>>('PUT', `rbac/roles/${id}/permissions`, {
            body: JSON.stringify(body),
          }),
        delete: () => request<ApiResult<RolePermissionsResponse>>('DELETE', `rbac/roles/${id}/permissions`),
      },
      parent: {
        get: () => request<ApiResult<RoleResponse>>('GET', `rbac/roles/${id}/parent`),
        patch: (body: SetRoleParentBody) =>
          request<ApiResult<RoleResponse>>('PATCH', `rbac/roles/${id}/parent`, {
            body: JSON.stringify(body),
          }),
      },
    }),
    {
      list: { get: rolesListGet },
      create: rolesCreate,
      get: rolesGet,
      update: rolesUpdate,
      delete: rolesDelete,
    },
  )

  // Permissions
  const permissionsListGet = (query?: PermissionListQuery) =>
    request<ApiResult<PermissionListResponse>>('GET', 'rbac/permissions', {
      params: query as Record<string, unknown>,
    })

  const permissionsCreate = (body: CreatePermissionBody) =>
    request<ApiResult<PermissionResponse>>('POST', 'rbac/permissions', {
      body: JSON.stringify(body),
    })

  const permissionsGet = (id: string) => request<ApiResult<PermissionResponse>>('GET', `rbac/permissions/${id}`)

  const permissionsDelete = (id: string) => request<ApiResult<null>>('DELETE', `rbac/permissions/${id}`)

  const permissionsAccessor: PermissionsAccessors = Object.assign(
    (id: string) => ({
      get: () => permissionsGet(id),
      delete: () => permissionsDelete(id),
    }),
    {
      list: { get: permissionsListGet },
      create: permissionsCreate,
      get: permissionsGet,
      delete: permissionsDelete,
    },
  )

  // Users (rbac/users/:userId/roles)
  const getUserRoles = (userId: string) => request<ApiResult<UserRolesResponse>>('GET', `rbac/users/${userId}/roles`)

  const assignUserRole = (userId: string, body: AssignRoleToUserBody) =>
    request<ApiResult<UserRolesResponse>>('POST', `rbac/users/${userId}/roles`, {
      body: JSON.stringify(body),
    })

  const removeUserRole = (userId: string, roleId: string) =>
    request<ApiResult<null>>('DELETE', `rbac/users/${userId}/roles/${roleId}`)

  const getUserPermissions = (userId: string) =>
    request<ApiResult<UserPermissionsResponse>>('GET', `rbac/users/${userId}/permissions`)

  const usersAccessor: RbacUsersAccessors = Object.assign(
    (userId: string) => ({
      get: () => getUserRoles(userId),
      post: (body: AssignRoleToUserBody) => assignUserRole(userId, body),
      delete: (roleId: string) => removeUserRole(userId, roleId),
    }),
    {
      get: getUserRoles,
      assign: assignUserRole,
      remove: removeUserRole,
      me: {
        permissions: { get: () => getUserPermissions('me') },
        roles: { get: () => getUserRoles('me') },
      },
    },
  )

  return {
    roles: rolesAccessor,
    permissions: permissionsAccessor,
    users: usersAccessor,
    getUserPermissions,
  }
}

// 导出类型
export type {
  RoleIdAccessor,
  RolesAccessors,
  PermissionIdAccessor,
  PermissionsAccessors,
  UserRolesIdAccessor,
  UserMeAccessor,
  RbacUsersAccessors,
}
