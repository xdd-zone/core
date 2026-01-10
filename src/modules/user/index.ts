/**
 * User 模块路由定义
 * 定义用户模块的所有 API 端点
 */

import { NotFoundError } from 'elysia'
import { authGuard, Require } from '@/core'
import { createModule } from '@/core/plugins'
import { CreateUserBodySchema, UpdateUserBodySchema, UserIdParamsSchema, UserListQuerySchema } from './user.model'
import { UserService } from './user.service'

/**
 * 用户模块 Elysia 实例
 * 说明：定义所有用户相关的 API 路由
 * 注意：使用 createModule 创建，自动注入 responsePlugin
 */
export const userModule = createModule({
  prefix: '/user',
  tags: ['User'],
})
  .use(authGuard({ required: true }))
  /**
   * 获取用户列表
   * GET /user
   * 支持分页、关键字搜索、状态过滤、软删除过滤
   *
   * 使用方式1：直接返回数据，自动包装为 {code: 0, message: "success", data}
   */
  .get(
    '/',
    async ({ query }) => {
      const result = await UserService.list(query)
      return result // 自动包装
    },
    {
      beforeHandle: [Require.Permission('user:read:all')],
      query: UserListQuerySchema,
      detail: {
        summary: '获取用户列表',
        description: '支持分页、关键字搜索、状态过滤、软删除过滤',
      },
    },
  )

  /**
   * 创建用户
   * POST /user
   *
   * 使用方式2：使用 ok() 显式包装，可自定义消息
   */
  .post(
    '/',
    async ({ body, ok }) => {
      const created = await UserService.create(body)
      return ok(created, '用户创建成功') // 自定义消息
    },
    {
      beforeHandle: [Require.UserCreate()],
      body: CreateUserBodySchema,
      detail: {
        summary: '创建用户',
        description: '创建新用户账号',
      },
    },
  )

  /**
   * 获取指定用户信息
   * GET /user/:id
   */
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
      beforeHandle: [Require.UserReadOwn()],
      params: UserIdParamsSchema,
      detail: {
        summary: '获取用户信息',
        description: '根据用户 ID 获取用户详细信息。普通用户只能查看自己的信息，管理员可以查看所有用户。',
      },
    },
  )

  /**
   * 更新指定用户信息
   * PATCH /user/:id
   */
  .patch(
    '/:id',
    async ({ params, body }) => {
      const updated = await UserService.update(params.id, body)
      return updated
    },
    {
      beforeHandle: [Require.UserUpdateOwn()],
      params: UserIdParamsSchema,
      body: UpdateUserBodySchema,
      detail: {
        summary: '更新用户信息',
        description: '更新用户基本信息（不包含密码）。普通用户只能更新自己的信息，管理员可以更新所有用户。',
      },
    },
  )

  /**
   * 删除指定用户
   * DELETE /user/:id
   */
  .delete(
    '/:id',
    async ({ params }) => {
      await UserService.delete(params.id)
      return { message: '用户删除成功' }
    },
    {
      beforeHandle: [Require.UserDeleteOwn()],
      params: UserIdParamsSchema,
      detail: {
        summary: '删除用户',
        description: '删除指定用户。普通用户只能删除自己的账号，管理员可以删除任何用户。',
      },
    },
  )

export * from './user.constants'
export * from './user.model'
export { UserRepository } from './user.repository'
// 导出模块和相关类型
export { UserService } from './user.service'
export * from './user.types'
