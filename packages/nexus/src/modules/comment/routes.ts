import type { AccessPluginInstance } from '@nexus/core'

import { Elysia } from 'elysia'

import {
  CommentIdParamsSchema,
  CommentListQuerySchema,
  CommentListSchema,
  CommentSchema,
  CreateCommentBodySchema,
  UpdateCommentStatusBodySchema,
} from './model'
import { CommentOpenApi } from './openapi'
import { CommentPermissions } from './permissions'
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
      permission: CommentPermissions.READ_ALL,
      query: CommentListQuerySchema,
      response: CommentListSchema,
      detail: CommentOpenApi.list,
    })
    .post('/', async ({ body }) => await CommentService.create(body), {
      body: CreateCommentBodySchema,
      response: CommentSchema,
      detail: CommentOpenApi.create,
    })
    .get('/:id', async ({ params }) => await CommentService.findById(params.id), {
      permission: CommentPermissions.READ_ALL,
      params: CommentIdParamsSchema,
      response: CommentSchema,
      detail: CommentOpenApi.findById,
    })
    .patch('/:id/status', async ({ body, params }) => await CommentService.updateStatus(params.id, body.status), {
      permission: CommentPermissions.MODERATE_ALL,
      params: CommentIdParamsSchema,
      body: UpdateCommentStatusBodySchema,
      response: CommentSchema,
      detail: CommentOpenApi.updateStatus,
    })
    .delete(
      '/:id',
      async ({ params, set }) => {
        await CommentService.remove(params.id)
        set.status = 204
      },
      {
        permission: CommentPermissions.MODERATE_ALL,
        params: CommentIdParamsSchema,
        detail: CommentOpenApi.remove,
      },
    )
}
