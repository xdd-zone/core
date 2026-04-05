import { accessPlugin, Permissions } from '@nexus/core/security'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import {
  CreatePageBodySchema,
  PageIdParamsSchema,
  PageListQuerySchema,
  PageListSchema,
  PageSchema,
  UpdatePageBodySchema,
} from './model'
import { PageRepository } from './repository'
import { PageService } from './service'

/**
 * 页面模块。
 */
export const pageModule = new Elysia({
  name: 'page-module',
  prefix: '/page',
  tags: ['Page'],
})
  .use(accessPlugin)
  .get('/', async ({ query }) => await PageService.list(query), {
    permission: Permissions.PAGE.READ_ALL,
    query: PageListQuerySchema,
    response: PageListSchema,
    detail: apiDetail({
      summary: '获取页面列表',
      description: '支持分页、关键字、状态和导航显示状态过滤。返回列表字段，不包含 Markdown 正文。',
      response: PageListSchema,
      errors: [400, 401, 403],
    }),
  })
  .post('/', async ({ body }) => await PageService.create(body), {
    permission: Permissions.PAGE.WRITE_ALL,
    body: CreatePageBodySchema,
    response: PageSchema,
    detail: apiDetail({
      summary: '创建页面',
      description: '创建一个新的草稿页面。',
      response: PageSchema,
      errors: [400, 401, 403, 409],
    }),
  })
  .get('/:id', async ({ params }) => await PageService.findById(params.id), {
    permission: Permissions.PAGE.READ_ALL,
    params: PageIdParamsSchema,
    response: PageSchema,
    detail: apiDetail({
      summary: '获取页面详情',
      description: '返回指定页面的完整内容和导航设置。',
      response: PageSchema,
      errors: [401, 403, 404],
    }),
  })
  .patch('/:id', async ({ body, params }) => await PageService.update(params.id, body), {
    permission: Permissions.PAGE.WRITE_ALL,
    params: PageIdParamsSchema,
    body: UpdatePageBodySchema,
    response: PageSchema,
    detail: apiDetail({
      summary: '更新页面',
      description: '更新指定页面的基础内容和导航设置。',
      response: PageSchema,
      errors: [400, 401, 403, 404, 409],
    }),
  })
  .delete(
    '/:id',
    async ({ params, set }) => {
      await PageService.remove(params.id)
      set.status = 204
    },
    {
      permission: Permissions.PAGE.WRITE_ALL,
      params: PageIdParamsSchema,
      detail: apiDetail({
        summary: '删除页面',
        description: '删除指定页面。',
        successStatus: 204,
        responseDescription: '页面删除成功',
        errors: [401, 403, 404],
      }),
    },
  )
  .post('/:id/publish', async ({ params }) => await PageService.publish(params.id), {
    permission: Permissions.PAGE.PUBLISH_ALL,
    params: PageIdParamsSchema,
    response: PageSchema,
    detail: apiDetail({
      summary: '发布页面',
      description: '发布指定页面，并写入发布时间。',
      response: PageSchema,
      errors: [400, 401, 403, 404, 409],
    }),
  })
  .post('/:id/unpublish', async ({ params }) => await PageService.unpublish(params.id), {
    permission: Permissions.PAGE.PUBLISH_ALL,
    params: PageIdParamsSchema,
    response: PageSchema,
    detail: apiDetail({
      summary: '取消发布页面',
      description: '将指定页面恢复为草稿，并清空发布时间。',
      response: PageSchema,
      errors: [401, 403, 404],
    }),
  })

export * from './constants'
export * from './model'
export { PageRepository }
export { PageService }
export * from './types'
