/**
 * RBAC 模块访问器
 */

import {
  AssignPermissionsToRoleBodySchema,
  AssignRoleToUserBodySchema,
  CreatePermissionBodySchema,
  CreateRoleBodySchema,
  CurrentUserPermissionsSchema,
  CurrentUserRolesSchema,
  OperationResultSchema,
  PermissionListQuerySchema,
  PermissionListSchema,
  PermissionSchema,
  ReplaceRolePermissionsBodySchema,
  RoleChildrenSchema,
  RoleDetailSchema,
  RoleListQuerySchema,
  RoleListSchema,
  RolePermissionsSchema,
  RoleSchema,
  SetRoleParentBodySchema,
  UpdateRoleBodySchema,
  UserPermissionsSchema,
  UserRoleAssignmentSchema,
  UserRolesSchema,
} from '@xdd-zone/schema/contracts/rbac'
import type { RequestFn } from '../../core/request'
import type {
  AssignPermissionsToRoleBody,
  AssignRoleToUserBody,
  CreatePermissionBody,
  CreateRoleBody,
  CurrentUserPermissions,
  CurrentUserRoles,
  OperationResult,
  PermissionListQuery,
  PermissionList,
  Permission,
  ReplaceRolePermissionsBody,
  RoleChildren,
  RoleDetail,
  RoleListQuery,
  RoleList,
  RolePermissions,
  Role,
  SetRoleParentBody,
  UpdateRoleBody,
  UserPermissions,
  UserRoleAssignment,
  UserRoles,
} from '../../types/rbac'

type Res<T> = Promise<T>

interface RoleIdAccessor {
  get(): Res<RoleDetail>
  patch(body: UpdateRoleBody): Res<Role>
  delete(): Res<void>
  permissions: {
    get(): Res<RolePermissions>
    post(body: AssignPermissionsToRoleBody): Res<OperationResult>
    patch(body: ReplaceRolePermissionsBody): Res<OperationResult>
    delete(permissionId: string): Res<void>
  }
  parent: {
    patch(body: SetRoleParentBody): Res<Role>
  }
  children: {
    get(): Res<RoleChildren>
  }
}

interface RolesAccessors {
  list: {
    get(query?: RoleListQuery): Res<RoleList>
  }
  create(body: CreateRoleBody): Res<Role>
  (id: string): RoleIdAccessor
  get(id: string): Res<RoleDetail>
  update(id: string, body: UpdateRoleBody): Res<Role>
  delete(id: string): Res<void>
}

interface PermissionIdAccessor {
  get(): Res<Permission>
}

interface PermissionsAccessors {
  list: {
    get(query?: PermissionListQuery): Res<PermissionList>
  }
  create(body: CreatePermissionBody): Res<Permission>
  (id: string): PermissionIdAccessor
  get(id: string): Res<Permission>
}

interface UserRolesIdAccessor {
  get(): Res<UserRoles>
  post(body: AssignRoleToUserBody): Res<UserRoleAssignment>
  delete(roleId: string): Res<void>
  refresh(roleId: string): Res<void>
}

interface UserMeAccessor {
  permissions: {
    get(): Res<CurrentUserPermissions>
  }
  roles: {
    get(): Res<CurrentUserRoles>
  }
}

interface RbacUsersAccessors {
  (userId: string): UserRolesIdAccessor
  get(userId: string): Res<UserRoles>
  assign(userId: string, body: AssignRoleToUserBody): Res<UserRoleAssignment>
  remove(userId: string, roleId: string): Res<void>
  refresh(userId: string, roleId: string): Res<void>
  me: UserMeAccessor
}

export interface RbacAccessors {
  roles: RolesAccessors
  permissions: PermissionsAccessors
  users: RbacUsersAccessors
  getUserPermissions(userId: string): Res<UserPermissions>
}

export function createRbacAccessor(request: RequestFn): RbacAccessors {
  const rolesListGet = (query?: RoleListQuery) =>
    request<RoleList>('GET', 'rbac/roles', {
      params: query ? (RoleListQuerySchema.parse(query) as Record<string, unknown>) : undefined,
      responseSchema: RoleListSchema,
    })

  const rolesCreate = (body: CreateRoleBody) =>
    request<Role>('POST', 'rbac/roles', {
      body: CreateRoleBodySchema.parse(body),
      responseSchema: RoleSchema,
    })

  const rolesGet = (id: string) => request<RoleDetail>('GET', `rbac/roles/${id}`, { responseSchema: RoleDetailSchema })

  const rolesUpdate = (id: string, body: UpdateRoleBody) =>
    request<Role>('PATCH', `rbac/roles/${id}`, {
      body: UpdateRoleBodySchema.parse(body),
      responseSchema: RoleSchema,
    })

  const rolesDelete = (id: string) => request<void>('DELETE', `rbac/roles/${id}`)

  const rolesAccessor: RolesAccessors = Object.assign(
    (id: string) => ({
      get: () => rolesGet(id),
      patch: (body: UpdateRoleBody) => rolesUpdate(id, body),
      delete: () => rolesDelete(id),
      permissions: {
        get: () =>
          request<RolePermissions>('GET', `rbac/roles/${id}/permissions`, {
            responseSchema: RolePermissionsSchema,
          }),
        post: (body: AssignPermissionsToRoleBody) =>
          request<OperationResult>('POST', `rbac/roles/${id}/permissions`, {
            body: AssignPermissionsToRoleBodySchema.parse(body),
            responseSchema: OperationResultSchema,
          }),
        patch: (body: ReplaceRolePermissionsBody) =>
          request<OperationResult>('PATCH', `rbac/roles/${id}/permissions`, {
            body: ReplaceRolePermissionsBodySchema.parse(body),
            responseSchema: OperationResultSchema,
          }),
        delete: (permissionId: string) => request<void>('DELETE', `rbac/roles/${id}/permissions/${permissionId}`),
      },
      parent: {
        patch: (body: SetRoleParentBody) =>
          request<Role>('PATCH', `rbac/roles/${id}/parent`, {
            body: SetRoleParentBodySchema.parse(body),
            responseSchema: RoleSchema,
          }),
      },
      children: {
        get: () =>
          request<RoleChildren>('GET', `rbac/roles/${id}/children`, {
            responseSchema: RoleChildrenSchema,
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

  const permissionsListGet = (query?: PermissionListQuery) =>
    request<PermissionList>('GET', 'rbac/permissions', {
      params: query ? (PermissionListQuerySchema.parse(query) as Record<string, unknown>) : undefined,
      responseSchema: PermissionListSchema,
    })

  const permissionsCreate = (body: CreatePermissionBody) =>
    request<Permission>('POST', 'rbac/permissions', {
      body: CreatePermissionBodySchema.parse(body),
      responseSchema: PermissionSchema,
    })

  const permissionsGet = (id: string) =>
    request<Permission>('GET', `rbac/permissions/${id}`, { responseSchema: PermissionSchema })

  const permissionsAccessor: PermissionsAccessors = Object.assign(
    (id: string) => ({
      get: () => permissionsGet(id),
    }),
    {
      list: { get: permissionsListGet },
      create: permissionsCreate,
      get: permissionsGet,
    },
  )

  const getUserRoles = (userId: string) =>
    request<UserRoles>('GET', `rbac/users/${userId}/roles`, {
      responseSchema: UserRolesSchema,
    })

  const assignUserRole = (userId: string, body: AssignRoleToUserBody) =>
    request<UserRoleAssignment>('POST', `rbac/users/${userId}/roles`, {
      body: AssignRoleToUserBodySchema.parse(body),
      responseSchema: UserRoleAssignmentSchema,
    })

  const removeUserRole = (userId: string, roleId: string) =>
    request<void>('DELETE', `rbac/users/${userId}/roles/${roleId}`)

  const refreshUserRole = (userId: string, roleId: string) =>
    request<void>('PATCH', `rbac/users/${userId}/roles/${roleId}`)

  const getUserPermissions = (userId: string) =>
    request<UserPermissions>('GET', `rbac/users/${userId}/permissions`, {
      responseSchema: UserPermissionsSchema,
    })

  const usersAccessor: RbacUsersAccessors = Object.assign(
    (userId: string) => ({
      get: () => getUserRoles(userId),
      post: (body: AssignRoleToUserBody) => assignUserRole(userId, body),
      delete: (roleId: string) => removeUserRole(userId, roleId),
      refresh: (roleId: string) => refreshUserRole(userId, roleId),
    }),
    {
      get: getUserRoles,
      assign: assignUserRole,
      remove: removeUserRole,
      refresh: refreshUserRole,
      me: {
        permissions: {
          get: () =>
            request<CurrentUserPermissions>('GET', 'rbac/users/me/permissions', {
              responseSchema: CurrentUserPermissionsSchema,
            }),
        },
        roles: {
          get: () =>
            request<CurrentUserRoles>('GET', 'rbac/users/me/roles', {
              responseSchema: CurrentUserRolesSchema,
            }),
        },
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

export type {
  PermissionIdAccessor,
  PermissionsAccessors,
  RoleIdAccessor,
  RolesAccessors,
  RbacUsersAccessors,
  UserMeAccessor,
  UserRolesIdAccessor,
}
