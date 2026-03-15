import { Elysia } from 'elysia'
import { Permissions, permit, permissionPlugin } from '@/plugins'
import { apiDetail } from '@/shared'
import * as Schemas from '@/modules/rbac'
import { RbacService } from '@/modules/rbac'

/**
 * RBAC 路由。
 */
export const rbacRoutes = new Elysia({
  prefix: '/rbac',
  tags: ['RBAC'],
})
  .use(permissionPlugin)
  .get('/roles', async ({ query }) => await RbacService.listRoles(query), {
    beforeHandle: [permit.permission(Permissions.ROLE.READ)],
    query: Schemas.RoleListQuerySchema,
    detail: apiDetail({
      summary: '获取角色列表',
      description: '支持分页、关键字搜索、系统角色过滤',
      response: Schemas.RoleListSchema,
      errors: [400, 401, 403],
    }),
  })
  .post('/roles', async ({ body }) => await RbacService.createRole(body), {
    beforeHandle: [permit.permission(Permissions.ROLE.CREATE)],
    body: Schemas.CreateRoleBodySchema,
    detail: apiDetail({
      summary: '创建角色',
      description: '创建新角色',
      response: Schemas.RoleSchema,
      errors: [400, 401, 403, 409],
    }),
  })
  .get('/roles/:id', async ({ params }) => await RbacService.getRoleDetail(params.id), {
    beforeHandle: [permit.permission(Permissions.ROLE.READ)],
    params: Schemas.RoleIdParamsSchema,
    detail: apiDetail({
      summary: '获取角色详情',
      description: '根据ID获取角色的详细信息，包含权限列表',
      response: Schemas.RoleDetailSchema,
      errors: [401, 403, 404],
    }),
  })
  .patch('/roles/:id', async ({ body, params }) => await RbacService.updateRole(params.id, body), {
    beforeHandle: [permit.permission(Permissions.ROLE.UPDATE_ALL)],
    params: Schemas.RoleIdParamsSchema,
    body: Schemas.UpdateRoleBodySchema,
    detail: apiDetail({
      summary: '更新角色',
      description: '更新角色信息',
      response: Schemas.RoleSchema,
      errors: [400, 401, 403, 404],
    }),
  })
  .delete(
    '/roles/:id',
    async ({ params, set }) => {
      await RbacService.deleteRole(params.id)
      set.status = 204
    },
    {
      beforeHandle: [permit.permission(Permissions.ROLE.DELETE_ALL)],
      params: Schemas.RoleIdParamsSchema,
      detail: apiDetail({
        summary: '删除角色',
        description: '删除指定角色（系统角色不可删除）',
        successStatus: 204,
        responseDescription: '角色删除成功',
        errors: [401, 403, 404],
      }),
    },
  )
  .patch('/roles/:id/parent', async ({ body, params }) => await RbacService.setRoleParent(params.id, body.parentId), {
    beforeHandle: [permit.permission(Permissions.ROLE.UPDATE_ALL)],
    params: Schemas.RoleIdParamsSchema,
    body: Schemas.SetRoleParentBodySchema,
    detail: apiDetail({
      summary: '设置父角色',
      description: '设置角色的父角色以实现继承',
      response: Schemas.RoleSchema,
      errors: [400, 401, 403, 404],
    }),
  })
  .get('/roles/:id/children', async ({ params }) => await RbacService.getRoleChildren(params.id), {
    beforeHandle: [permit.permission(Permissions.ROLE.READ)],
    params: Schemas.RoleIdParamsSchema,
    detail: apiDetail({
      summary: '获取子角色列表',
      description: '获取指定角色的所有直接子角色',
      response: Schemas.RoleChildrenSchema,
      errors: [401, 403, 404],
    }),
  })
  .get('/permissions', async ({ query }) => await RbacService.listPermissions(query), {
    beforeHandle: [permit.permission(Permissions.PERMISSION.READ)],
    query: Schemas.PermissionListQuerySchema,
    detail: apiDetail({
      summary: '获取权限列表',
      description: '支持分页、按资源过滤',
      response: Schemas.PermissionListSchema,
      errors: [400, 401, 403],
    }),
  })
  .get('/permissions/:id', async ({ params }) => await RbacService.getPermissionDetail(params.id), {
    beforeHandle: [permit.permission(Permissions.PERMISSION.READ)],
    params: Schemas.PermissionIdParamsSchema,
    detail: apiDetail({
      summary: '获取权限详情',
      description: '根据ID获取权限详细信息',
      response: Schemas.PermissionSchema,
      errors: [401, 403, 404],
    }),
  })
  .post('/permissions', async ({ body }) => await RbacService.createPermission(body), {
    beforeHandle: [permit.permission(Permissions.PERMISSION.CREATE)],
    body: Schemas.CreatePermissionBodySchema,
    detail: apiDetail({
      summary: '创建权限',
      description: '创建自定义权限',
      response: Schemas.PermissionSchema,
      errors: [400, 401, 403, 409],
    }),
  })
  .get('/roles/:id/permissions', async ({ params }) => await RbacService.getRolePermissions(params.id), {
    beforeHandle: [permit.permission(Permissions.ROLE.READ)],
    params: Schemas.RoleIdParamsSchema,
    detail: apiDetail({
      summary: '获取角色权限列表',
      description: '获取指定角色的所有权限',
      response: Schemas.RolePermissionsSchema,
      errors: [401, 403, 404],
    }),
  })
  .post(
    '/roles/:id/permissions',
    async ({ body, params }) => await RbacService.assignPermissionsToRole(params.id, body.permissionIds),
    {
      beforeHandle: [permit.permission(Permissions.ROLE_PERMISSION.CREATE)],
      params: Schemas.RoleIdParamsSchema,
      body: Schemas.AssignPermissionsToRoleBodySchema,
      detail: apiDetail({
        summary: '为角色分配权限',
        description: '为角色添加一个或多个权限',
        response: Schemas.OperationResultSchema,
        errors: [400, 401, 403, 404],
      }),
    },
  )
  .delete(
    '/roles/:id/permissions/:permissionId',
    async ({ params, set }) => {
      await RbacService.removePermissionFromRole(params.id, params.permissionId)
      set.status = 204
    },
    {
      beforeHandle: [permit.permission(Permissions.ROLE_PERMISSION.DELETE)],
      params: Schemas.RolePermissionIdParamsSchema,
      detail: apiDetail({
        summary: '移除角色权限',
        description: '从指定角色中移除某个权限',
        successStatus: 204,
        responseDescription: '权限移除成功',
        errors: [401, 403, 404],
      }),
    },
  )
  .patch(
    '/roles/:id/permissions',
    async ({ body, params }) => await RbacService.replaceRolePermissions(params.id, body.permissionIds),
    {
      beforeHandle: [permit.permission(Permissions.ROLE_PERMISSION.DELETE)],
      params: Schemas.RoleIdParamsSchema,
      body: Schemas.ReplaceRolePermissionsBodySchema,
      detail: apiDetail({
        summary: '批量替换角色权限',
        description: '完全替换角色的权限列表',
        response: Schemas.OperationResultSchema,
        errors: [400, 401, 403, 404],
      }),
    },
  )
  .get('/users/:userId/roles', async ({ params }) => await RbacService.getUserRoles(params.userId), {
    beforeHandle: [permit.own(Permissions.USER_ROLE.READ_OWN, 'userId')],
    params: Schemas.RBACUserIdParamsSchema,
    detail: apiDetail({
      summary: '获取用户角色列表',
      description: '获取指定用户的所有角色（只能查看自己或需要 read_all 权限）',
      response: Schemas.UserRolesSchema,
      errors: [401, 403],
    }),
  })
  .post(
    '/users/:userId/roles',
    async ({ body, params }) => await RbacService.assignRoleToUser(params.userId, body.roleId),
    {
      beforeHandle: [permit.permission(Permissions.USER_ROLE.CREATE_ALL)],
      params: Schemas.RBACUserIdParamsSchema,
      body: Schemas.AssignRoleToUserBodySchema,
      detail: apiDetail({
        summary: '为用户分配角色',
        description: '为用户分配角色',
        response: Schemas.UserRoleAssignmentSchema,
        errors: [400, 401, 403, 404],
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
      beforeHandle: [permit.permission(Permissions.USER_ROLE.DELETE_ALL)],
      params: Schemas.UserRoleIdParamsSchema,
      detail: apiDetail({
        summary: '移除用户角色',
        description: '从指定用户中移除某个角色',
        successStatus: 204,
        responseDescription: '角色移除成功',
        errors: [401, 403, 404],
      }),
    },
  )
  .patch(
    '/users/:userId/roles/:roleId',
    async ({ params, set }) => {
      await RbacService.refreshUserRoleCache(params.userId, params.roleId)
      set.status = 204
    },
    {
      beforeHandle: [permit.permission(Permissions.USER_ROLE.UPDATE_ALL)],
      params: Schemas.UserRoleIdParamsSchema,
      detail: apiDetail({
        summary: '刷新用户角色缓存',
        description: '校验指定用户角色关联存在后刷新该用户的权限缓存',
        successStatus: 204,
        responseDescription: '用户角色缓存已刷新',
        errors: [401, 403, 404],
      }),
    },
  )
  .get('/users/:userId/permissions', async ({ params }) => await RbacService.getUserPermissions(params.userId), {
    beforeHandle: [permit.own(Permissions.USER_PERMISSION.READ_OWN, 'userId')],
    params: Schemas.RBACUserIdParamsSchema,
    detail: apiDetail({
      summary: '获取用户所有权限',
      description: '获取指定用户的所有权限（含继承）（只能查看自己或需要 read_all 权限）',
      response: Schemas.UserPermissionsSchema,
      errors: [401, 403],
    }),
  })
  .get(
    '/users/me/permissions',
    async ({ request, requireAuth }) => {
      const { user } = await requireAuth(request)
      return await RbacService.getCurrentUserPermissions(user.id)
    },
    {
      beforeHandle: [permit.me(Permissions.USER_PERMISSION.READ_OWN)],
      detail: apiDetail({
        summary: '获取当前用户权限',
        description: '返回当前登录用户的所有权限（含继承）',
        response: Schemas.CurrentUserPermissionsSchema,
        errors: [401, 403, 404],
      }),
    },
  )
  .get(
    '/users/me/roles',
    async ({ request, requireAuth }) => {
      const { user } = await requireAuth(request)
      return await RbacService.getCurrentUserRoles(user.id)
    },
    {
      beforeHandle: [permit.me(Permissions.USER_ROLE.READ_OWN)],
      detail: apiDetail({
        summary: '获取当前用户角色',
        description: '返回当前登录用户的角色列表',
        response: Schemas.CurrentUserRolesSchema,
        errors: [401, 403],
      }),
    },
  )
