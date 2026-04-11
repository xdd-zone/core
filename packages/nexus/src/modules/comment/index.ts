import type { AccessPluginInstance } from '@nexus/core/security'
import { Permissions } from '@nexus/core/security'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import {
  CommentIdParamsSchema,
  CommentListQuerySchema,
  CommentListSchema,
  CommentSchema,
  UpdateCommentStatusBodySchema,
} from './model'
import { CommentRepository } from './repository'
import { CommentService } from './service'

/**
 * 评论模块。
 */
export interface CommentModuleOptions {
  accessPlugin: AccessPluginInstance
}

export function createCommentModule({ accessPlugin }: CommentModuleOptions) {
  return new Elysia({
    name: 'comment-module',
    prefix: '/comment',
    tags: ['Comment'],
  })
    .use(accessPlugin)
    .get('/', async ({ query }) => await CommentService.list(query), {
      permission: Permissions.COMMENT.READ_ALL,
      query: CommentListQuerySchema,
      response: CommentListSchema,
      detail: apiDetail({
        summary: '获取评论列表',
        description: '支持按状态、关联文章、关键字和时间范围筛选评论。',
        response: CommentListSchema,
        errors: [400, 401, 403],
      }),
    })
    .get('/:id', async ({ params }) => await CommentService.findById(params.id), {
      permission: Permissions.COMMENT.READ_ALL,
      params: CommentIdParamsSchema,
      response: CommentSchema,
      detail: apiDetail({
        summary: '获取评论详情',
        description: '返回指定评论的基础内容和当前审核状态。',
        response: CommentSchema,
        errors: [401, 403, 404],
      }),
    })
    .patch('/:id/status', async ({ body, params }) => await CommentService.updateStatus(params.id, body.status), {
      permission: Permissions.COMMENT.MODERATE_ALL,
      params: CommentIdParamsSchema,
      body: UpdateCommentStatusBodySchema,
      response: CommentSchema,
      detail: apiDetail({
        summary: '更新评论状态',
        description: '将评论切换为待审核、已通过或已隐藏状态。',
        response: CommentSchema,
        errors: [400, 401, 403, 404],
      }),
    })
    .delete(
      '/:id',
      async ({ params, set }) => {
        await CommentService.remove(params.id)
        set.status = 204
      },
      {
        permission: Permissions.COMMENT.MODERATE_ALL,
        params: CommentIdParamsSchema,
        detail: apiDetail({
          summary: '删除评论',
          description: '将指定评论标记为已删除。',
          successStatus: 204,
          responseDescription: '评论删除成功',
          errors: [401, 403, 404],
        }),
      },
    )
}

export * from './constants'
export * from './model'
export { CommentRepository }
export { CommentService }
export * from './types'
