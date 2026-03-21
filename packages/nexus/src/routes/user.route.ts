import { Elysia, NotFoundError } from 'elysia'
import { Permissions, permissionPlugin } from '@/core/access-control'
import { apiDetail } from '@/shared'
import {
  CreateUserBodySchema,
  UpdateUserBodySchema,
  UserListSchema,
  UserIdParamsSchema,
  UserSchema,
  UserListQuerySchema,
} from '@/modules/user'
import { UserService } from '@/modules/user'

/**
 * 用户路由。
 */
export const userRoutes = new Elysia({
  prefix: '/user',
  tags: ['User'],
})
  .use(permissionPlugin)
  .get('/', async ({ query }) => await UserService.list(query), {
    permission: Permissions.USER.READ_ALL,
    query: UserListQuerySchema,
    response: UserListSchema,
    detail: apiDetail({
      summary: '获取用户列表',
      description: '支持分页、关键字搜索、状态过滤、软删除过滤',
      response: UserListSchema,
      errors: [400, 401, 403],
    }),
  })
  .post('/', async ({ body }) => await UserService.create(body), {
    permission: Permissions.USER.CREATE,
    body: CreateUserBodySchema,
    response: UserSchema,
    detail: apiDetail({
      summary: '创建用户',
      description: '创建新用户账号',
      response: UserSchema,
      errors: [400, 401, 403, 409],
    }),
  })
  .get(
    '/:id',
    async ({ params }) => {
      const user = await UserService.findById(params.id)
      if (!user) {
        throw new NotFoundError('用户不存在')
      }

      return user
    },
    {
      own: Permissions.USER.READ_OWN,
      params: UserIdParamsSchema,
      response: UserSchema,
      detail: apiDetail({
        summary: '获取用户信息',
        description: '根据用户 ID 获取用户详细信息。普通用户只能查看自己的信息，管理员可以查看所有用户。',
        response: UserSchema,
        errors: [401, 403, 404],
      }),
    },
  )
  .patch('/:id', async ({ body, params }) => await UserService.update(params.id, body), {
    own: Permissions.USER.UPDATE_OWN,
    params: UserIdParamsSchema,
    body: UpdateUserBodySchema,
    response: UserSchema,
    detail: apiDetail({
      summary: '更新用户信息',
      description: '更新用户基本信息（不包含密码）。普通用户只能更新自己的信息，管理员可以更新所有用户。',
      response: UserSchema,
      errors: [400, 401, 403, 404, 409],
    }),
  })
  .delete(
    '/:id',
    async ({ params, set }) => {
      await UserService.delete(params.id)
      set.status = 204
    },
    {
      own: Permissions.USER.DELETE_OWN,
      params: UserIdParamsSchema,
      detail: apiDetail({
        summary: '删除用户',
        description: '删除指定用户。普通用户只能删除自己的账号，管理员可以删除任何用户。',
        successStatus: 204,
        responseDescription: '用户删除成功',
        errors: [401, 403, 404],
      }),
    },
  )
