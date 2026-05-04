import type { AccessPluginInstance } from '@nexus/core'

import { assertAuthenticated, Permissions } from '@nexus/core'
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
import { RbacOpenApi } from './openapi'
import { RbacService } from './service'

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
      detail: RbacOpenApi.listRoles,
    })
    .get('/users/:userId/roles', async ({ params }) => await RbacService.getUserRoles(params.userId), {
      permission: Permissions.ROLE.READ_ALL,
      params: RBACUserIdParamsSchema,
      response: UserRolesSchema,
      detail: RbacOpenApi.getUserRoles,
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
        detail: RbacOpenApi.assignRoleToUser,
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
        detail: RbacOpenApi.removeRoleFromUser,
      },
    )
    .get('/users/:userId/permissions', async ({ params }) => await RbacService.getUserPermissions(params.userId), {
      permission: Permissions.USER_PERMISSION.READ_ALL,
      params: RBACUserIdParamsSchema,
      response: UserPermissionsSchema,
      detail: RbacOpenApi.getUserPermissions,
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
        detail: RbacOpenApi.getCurrentUserPermissions,
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
        detail: RbacOpenApi.getCurrentUserRoles,
      },
    )
}
