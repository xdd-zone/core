import { assertAuthenticated, authPlugin, permissionPlugin, Permissions } from '@nexus/core/access-control'
import {
  UpdateMyProfileBodySchema,
  UpdateUserBodySchema,
  UpdateUserStatusBodySchema,
  UserIdParamsSchema,
  UserListQuerySchema,
  UserListSchema,
  UserSchema,
  UserService,
} from '@nexus/modules/user'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'

/**
 * 用户路由。
 */
export const userRoutes = new Elysia({
  prefix: '/user',
  tags: ['User'],
})
  .use(authPlugin)
  .use(permissionPlugin)
  .get(
    '/me',
    async ({ auth }) => {
      assertAuthenticated(auth)

      return await UserService.getProfile(auth.user.id)
    },
    {
      auth: 'required',
      me: Permissions.USER.READ_OWN,
      response: UserSchema,
      detail: apiDetail({
        summary: '获取当前用户资料',
        description: '返回当前登录用户的基础资料。',
        response: UserSchema,
        errors: [401, 403, 404],
      }),
    },
  )
  .patch(
    '/me',
    async ({ auth, body }) => {
      assertAuthenticated(auth)

      return await UserService.updateProfile(auth.user.id, body)
    },
    {
      auth: 'required',
      me: Permissions.USER.UPDATE_OWN,
      body: UpdateMyProfileBodySchema,
      response: UserSchema,
      detail: apiDetail({
        summary: '更新当前用户资料',
        description: '更新当前登录用户的基础资料，不包含角色和状态。',
        response: UserSchema,
        errors: [400, 401, 403, 404, 409],
      }),
    },
  )
  .get('/', async ({ query }) => await UserService.list(query), {
    permission: Permissions.USER.READ_ALL,
    query: UserListQuerySchema,
    response: UserListSchema,
    detail: apiDetail({
      summary: '获取用户列表',
      description: '支持分页、关键字搜索与状态过滤，默认只返回未归档用户。',
      response: UserListSchema,
      errors: [400, 401, 403],
    }),
  })
  .patch('/:id/status', async ({ body, params }) => await UserService.updateStatus(params.id, body.status), {
    permission: Permissions.USER.DISABLE_ALL,
    params: UserIdParamsSchema,
    body: UpdateUserStatusBodySchema,
    response: UserSchema,
    detail: apiDetail({
      summary: '更新用户状态',
      description: '后台管理员启用、停用或封禁指定用户。',
      response: UserSchema,
      errors: [400, 401, 403, 404],
    }),
  })
  .get('/:id', async ({ params }) => await UserService.findById(params.id), {
    permission: Permissions.USER.READ_ALL,
    params: UserIdParamsSchema,
    response: UserSchema,
    detail: apiDetail({
      summary: '获取用户详情',
      description: '后台管理员查看指定用户的基础资料。',
      response: UserSchema,
      errors: [401, 403, 404],
    }),
  })
  .patch('/:id', async ({ body, params }) => await UserService.updateByAdmin(params.id, body), {
    permission: Permissions.USER.UPDATE_ALL,
    params: UserIdParamsSchema,
    body: UpdateUserBodySchema,
    response: UserSchema,
    detail: apiDetail({
      summary: '更新用户基础资料',
      description: '后台管理员更新指定用户的基础资料，不包含状态变更。',
      response: UserSchema,
      errors: [400, 401, 403, 404, 409],
    }),
  })
