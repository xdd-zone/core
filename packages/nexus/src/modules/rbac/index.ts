import type { AccessPluginInstance } from '@nexus/core/security'
import { assertAuthenticated, Permissions } from '@nexus/core/security'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import {
  AssignRoleToUserBodySchema,
  CurrentUserPermissionsSchema,
  CurrentUserRolesSchema,
  RBACUserIdParamsSchema,
  RoleListQuerySchema,
  RoleListSchema,
  UserPermissionsSchema,
  UserRoleAssignmentSchema,
  UserRoleIdParamsSchema,
  UserRolesSchema,
} from './model'
import { RoleRepository } from './role.repository'
import { RbacService } from './service'
import { UserRoleRepository } from './user-role.repository'

/**
 * RBAC 模块。
 */
export interface RbacModuleOptions {
  accessPlugin: AccessPluginInstance
}

export function createRbacModule({ accessPlugin }: RbacModuleOptions) {
  return new Elysia({
    name: 'rbac-module',
    prefix: '/rbac',
    tags: ['RBAC'],
  })
    .use(accessPlugin)
    .get('/roles', async ({ query }) => await RbacService.listRoles(query), {
      permission: Permissions.ROLE.READ_ALL,
      query: RoleListQuerySchema,
      response: RoleListSchema,
      detail: apiDetail({
        summary: '获取角色列表',
        description: '返回系统内置角色列表。',
        response: RoleListSchema,
        errors: [400, 401, 403],
      }),
    })
    .get('/users/:userId/roles', async ({ params }) => await RbacService.getUserRoles(params.userId), {
      permission: Permissions.ROLE.READ_ALL,
      params: RBACUserIdParamsSchema,
      response: UserRolesSchema,
      detail: apiDetail({
        summary: '获取用户角色列表',
        description: '超级管理员查看指定用户当前已分配的固定系统角色。',
        response: UserRolesSchema,
        errors: [401, 403, 404],
      }),
    })
    .post(
      '/users/:userId/roles',
      async ({ auth, body, params }) => {
        assertAuthenticated(auth)

        return await RbacService.assignRoleToUser(params.userId, body.roleId, auth.user.id)
      },
      {
        permission: Permissions.USER_ROLE.ASSIGN_ALL,
        params: RBACUserIdParamsSchema,
        body: AssignRoleToUserBodySchema,
        response: UserRoleAssignmentSchema,
        detail: apiDetail({
          summary: '为用户分配角色',
          description: '为指定用户分配固定系统角色，并记录授权人。',
          response: UserRoleAssignmentSchema,
          errors: [400, 401, 403, 404, 409],
        }),
      },
    )
    .delete(
      '/users/:userId/roles/:roleId',
      async ({ params, set }) => {
        await RbacService.removeRoleFromUser(params.userId, params.roleId)
        set.status = 204
      },
      {
        permission: Permissions.USER_ROLE.REVOKE_ALL,
        params: UserRoleIdParamsSchema,
        detail: apiDetail({
          summary: '移除用户角色',
          description: '移除指定用户已分配的固定系统角色。',
          successStatus: 204,
          responseDescription: '角色移除成功',
          errors: [401, 403, 404],
        }),
      },
    )
    .get('/users/:userId/permissions', async ({ params }) => await RbacService.getUserPermissions(params.userId), {
      permission: Permissions.USER_PERMISSION.READ_ALL,
      params: RBACUserIdParamsSchema,
      response: UserPermissionsSchema,
      detail: apiDetail({
        summary: '获取用户权限',
        description: '超级管理员查看指定用户的有效权限集合。',
        response: UserPermissionsSchema,
        errors: [401, 403, 404],
      }),
    })
    .get(
      '/users/me/permissions',
      async ({ auth }) => {
        assertAuthenticated(auth)

        return await RbacService.getCurrentUserPermissions(auth.user.id)
      },
      {
        auth: 'required',
        me: Permissions.USER_PERMISSION.READ_OWN,
        response: CurrentUserPermissionsSchema,
        detail: apiDetail({
          summary: '获取当前用户权限',
          description: '返回当前登录用户的有效权限集合和角色列表。',
          response: CurrentUserPermissionsSchema,
          errors: [401, 403, 404],
        }),
      },
    )
    .get(
      '/users/me/roles',
      async ({ auth }) => {
        assertAuthenticated(auth)

        return await RbacService.getCurrentUserRoles(auth.user.id)
      },
      {
        auth: 'required',
        response: CurrentUserRolesSchema,
        detail: apiDetail({
          summary: '获取当前用户角色',
          description: '返回当前登录用户已分配的角色列表。',
          response: CurrentUserRolesSchema,
          errors: [401, 404],
        }),
      },
    )
}

export {
  DEFAULT_ROLE_NAME,
  FIRST_USER_ROLE_NAME,
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSION_KEYS,
  type SystemRoleName,
} from './constants'
export {
  type AssignRoleToUserBody,
  AssignRoleToUserBodySchema,
  type CurrentUserPermissions,
  CurrentUserPermissionsSchema,
  type CurrentUserRole,
  type CurrentUserRoles,
  CurrentUserRoleSchema,
  type CurrentUserRoleSource,
  CurrentUserRoleSourceSchema,
  CurrentUserRolesSchema,
  type PermissionScope,
  PermissionScopeSchema,
  type PermissionString,
  PermissionStringSchema,
  type PermissionSummary,
  PermissionSummarySchema,
  type RBACUserIdParams,
  RBACUserIdParamsSchema,
  type Role,
  type RoleIdParams,
  RoleIdParamsSchema,
  type RoleList,
  type RoleListQuery,
  RoleListQuerySchema,
  RoleListSchema,
  RoleSchema,
  type UserPermissions,
  UserPermissionsSchema,
  type UserRoleAssignment,
  UserRoleAssignmentSchema,
  type UserRoleIdParams,
  UserRoleIdParamsSchema,
  type UserRoleItem,
  UserRoleItemSchema,
  type UserRoles,
  UserRolesSchema,
} from './model'
export { RoleRepository }
export { RbacService }
export type { UserPermissionsResponse } from './types'
export { UserRoleRepository }
