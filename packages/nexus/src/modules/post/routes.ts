import type { AccessPluginInstance } from '@nexus/core'

import { Elysia } from 'elysia'

import {
  CreatePostBodySchema,
  PostIdParamsSchema,
  PostListQuerySchema,
  PostListSchema,
  PostSchema,
  UpdatePostBodySchema,
} from './model'
import { PostOpenApi } from './openapi'
import { PostPermissions } from './permissions'
import { PostService } from './service'

/**
 * 文章模块。
 */
export interface PostModuleOptions {
  accessPlugin: AccessPluginInstance
}

export function createPostModule({ accessPlugin }: PostModuleOptions) {
  return new Elysia({
    name: 'post-module',
    prefix: '/post',
    tags: ['Post'],
  })
    .use(accessPlugin)
    .get('/', async ({ query }) => await PostService.list(query), {
      permission: PostPermissions.READ_ALL,
      query: PostListQuerySchema,
      response: PostListSchema,
      detail: PostOpenApi.list,
    })
    .post('/', async ({ body }) => await PostService.create(body), {
      permission: PostPermissions.WRITE_ALL,
      body: CreatePostBodySchema,
      response: PostSchema,
      detail: PostOpenApi.create,
    })
    .get('/:id', async ({ params }) => await PostService.findById(params.id), {
      permission: PostPermissions.READ_ALL,
      params: PostIdParamsSchema,
      response: PostSchema,
      detail: PostOpenApi.findById,
    })
    .patch('/:id', async ({ body, params }) => await PostService.update(params.id, body), {
      permission: PostPermissions.WRITE_ALL,
      params: PostIdParamsSchema,
      body: UpdatePostBodySchema,
      response: PostSchema,
      detail: PostOpenApi.update,
    })
    .delete(
      '/:id',
      async ({ params, set }) => {
        await PostService.remove(params.id)
        set.status = 204
      },
      {
        permission: PostPermissions.WRITE_ALL,
        params: PostIdParamsSchema,
        detail: PostOpenApi.remove,
      },
    )
    .post('/:id/publish', async ({ params }) => await PostService.publish(params.id), {
      permission: PostPermissions.PUBLISH_ALL,
      params: PostIdParamsSchema,
      response: PostSchema,
      detail: PostOpenApi.publish,
    })
    .post('/:id/unpublish', async ({ params }) => await PostService.unpublish(params.id), {
      permission: PostPermissions.PUBLISH_ALL,
      params: PostIdParamsSchema,
      response: PostSchema,
      detail: PostOpenApi.unpublish,
    })
}
