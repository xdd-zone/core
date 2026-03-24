import { assertAuthenticated, authPlugin, permissionPlugin, Permissions } from '@nexus/core/access-control'
import * as Schemas from '@nexus/modules/rbac'
import { RbacService } from '@nexus/modules/rbac'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'

/**
 * RBAC 路由。
 */
export const rbacRoutes = new Elysia({
  prefix: '/rbac',
  tags: ['RBAC'],
})
  .use(authPlugin)
  .use(permissionPlugin)
  .get('/roles', async ({ query }) => await RbacService.listRoles(query), {
    permission: Permissions.ROLE.READ_ALL,
    query: Schemas.RoleListQuerySchema,
    response: Schemas.RoleListSchema,
    detail: apiDetail({
      summary: '获取角色列表',
      description: '返回系统内置角色列表。',
      response: Schemas.RoleListSchema,
      errors: [400, 401, 403],
    }),
  })
  .get('/users/:userId/roles', async ({ params }) => await RbacService.getUserRoles(params.userId), {
    permission: Permissions.ROLE.READ_ALL,
    params: Schemas.RBACUserIdParamsSchema,
    response: Schemas.UserRolesSchema,
    detail: apiDetail({
      summary: '获取用户角色列表',
      description: '后台管理员查看指定用户当前已分配的固定系统角色。',
      response: Schemas.UserRolesSchema,
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
      params: Schemas.RBACUserIdParamsSchema,
      body: Schemas.AssignRoleToUserBodySchema,
      response: Schemas.UserRoleAssignmentSchema,
      detail: apiDetail({
        summary: '为用户分配角色',
        description: '为指定用户分配固定系统角色，并记录授权人。',
        response: Schemas.UserRoleAssignmentSchema,
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
      params: Schemas.UserRoleIdParamsSchema,
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
    params: Schemas.RBACUserIdParamsSchema,
    response: Schemas.UserPermissionsSchema,
    detail: apiDetail({
      summary: '获取用户权限',
      description: '后台管理员查看指定用户的有效权限集合。',
      response: Schemas.UserPermissionsSchema,
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
      response: Schemas.CurrentUserPermissionsSchema,
      detail: apiDetail({
        summary: '获取当前用户权限',
        description: '返回当前登录用户的有效权限集合和角色列表。',
        response: Schemas.CurrentUserPermissionsSchema,
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
      response: Schemas.CurrentUserRolesSchema,
      detail: apiDetail({
        summary: '获取当前用户角色',
        description: '返回当前登录用户已分配的角色列表。',
        response: Schemas.CurrentUserRolesSchema,
        errors: [401, 404],
      }),
    },
  )
