import type { AccessPluginInstance } from '@nexus/core/security'
import { Permissions } from '@nexus/core/security'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import {
  CreatePostBodySchema,
  PostIdParamsSchema,
  PostListQuerySchema,
  PostListSchema,
  PostSchema,
  UpdatePostBodySchema,
} from './model'
import { PostRepository } from './repository'
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
      permission: Permissions.POST.READ_ALL,
      query: PostListQuerySchema,
      response: PostListSchema,
      detail: apiDetail({
        summary: '获取文章列表',
        description: '支持分页、关键字、状态、分类和标签过滤。',
        response: PostListSchema,
        errors: [400, 401, 403],
      }),
    })
    .post('/', async ({ body }) => await PostService.create(body), {
      permission: Permissions.POST.WRITE_ALL,
      body: CreatePostBodySchema,
      response: PostSchema,
      detail: apiDetail({
        summary: '创建文章',
        description: '创建一篇新的草稿文章。',
        response: PostSchema,
        errors: [400, 401, 403, 409],
      }),
    })
    .get('/:id', async ({ params }) => await PostService.findById(params.id), {
      permission: Permissions.POST.READ_ALL,
      params: PostIdParamsSchema,
      response: PostSchema,
      detail: apiDetail({
        summary: '获取文章详情',
        description: '返回指定文章的完整内容和发布信息。',
        response: PostSchema,
        errors: [401, 403, 404],
      }),
    })
    .patch('/:id', async ({ body, params }) => await PostService.update(params.id, body), {
      permission: Permissions.POST.WRITE_ALL,
      params: PostIdParamsSchema,
      body: UpdatePostBodySchema,
      response: PostSchema,
      detail: apiDetail({
        summary: '更新文章',
        description: '更新指定文章的基础内容和元信息。',
        response: PostSchema,
        errors: [400, 401, 403, 404, 409],
      }),
    })
    .delete(
      '/:id',
      async ({ params, set }) => {
        await PostService.remove(params.id)
        set.status = 204
      },
      {
        permission: Permissions.POST.WRITE_ALL,
        params: PostIdParamsSchema,
        detail: apiDetail({
          summary: '删除文章',
          description: '删除指定文章。',
          successStatus: 204,
          responseDescription: '文章删除成功',
          errors: [401, 403, 404],
        }),
      },
    )
    .post('/:id/publish', async ({ params }) => await PostService.publish(params.id), {
      permission: Permissions.POST.PUBLISH_ALL,
      params: PostIdParamsSchema,
      response: PostSchema,
      detail: apiDetail({
        summary: '发布文章',
        description: '发布指定文章，并写入发布时间。',
        response: PostSchema,
        errors: [400, 401, 403, 404, 409],
      }),
    })
    .post('/:id/unpublish', async ({ params }) => await PostService.unpublish(params.id), {
      permission: Permissions.POST.PUBLISH_ALL,
      params: PostIdParamsSchema,
      response: PostSchema,
      detail: apiDetail({
        summary: '取消发布文章',
        description: '将指定文章恢复为草稿，并清空发布时间。',
        response: PostSchema,
        errors: [401, 403, 404],
      }),
    })
}

export * from './constants'
export * from './model'
export { PostRepository }
export { PostService }
export * from './types'
