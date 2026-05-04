import type { AccessPluginInstance } from '@nexus/core/security'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import { CATEGORY_MANAGE_PERMISSIONS } from '../../public/category-types'
import { PostPermissions } from '../post/permissions'
import {
  CategoryIdParamsSchema,
  CategoryListQuerySchema,
  CategoryListSchema,
  CategorySchema,
  CreateCategoryBodySchema,
  UpdateCategoryBodySchema,
} from './model'
import { CategoryRepository } from './repository'
import { CategoryService } from './service'

export interface CategoryModuleOptions {
  accessPlugin: AccessPluginInstance
}

export function createCategoryModule({ accessPlugin }: CategoryModuleOptions) {
  return new Elysia({
    name: 'category-module',
    prefix: '/category',
    tags: ['Category'],
  })
    .use(accessPlugin)
    .get('/', async ({ query }) => await CategoryService.list(query), {
      permission: { any: CATEGORY_MANAGE_PERMISSIONS },
      query: CategoryListQuerySchema,
      response: CategoryListSchema,
      detail: apiDetail({
        summary: '获取分类列表',
        description: '支持分页、关键字和可见状态筛选。',
        response: CategoryListSchema,
        errors: [400, 401, 403],
      }),
    })
    .post('/', async ({ body }) => await CategoryService.create(body), {
      permission: PostPermissions.WRITE_ALL,
      body: CreateCategoryBodySchema,
      response: CategorySchema,
      detail: apiDetail({
        summary: '创建分类',
        description: '创建一个文章分类。',
        response: CategorySchema,
        errors: [400, 401, 403, 409],
      }),
    })
    .get('/:id', async ({ params }) => await CategoryService.findById(params.id), {
      permission: { any: CATEGORY_MANAGE_PERMISSIONS },
      params: CategoryIdParamsSchema,
      response: CategorySchema,
      detail: apiDetail({
        summary: '获取分类详情',
        description: '返回指定分类和文章数量。',
        response: CategorySchema,
        errors: [401, 403, 404],
      }),
    })
    .patch('/:id', async ({ body, params }) => await CategoryService.update(params.id, body), {
      permission: PostPermissions.WRITE_ALL,
      params: CategoryIdParamsSchema,
      body: UpdateCategoryBodySchema,
      response: CategorySchema,
      detail: apiDetail({
        summary: '更新分类',
        description: '更新指定分类的名称、slug、说明、排序和可见状态。',
        response: CategorySchema,
        errors: [400, 401, 403, 404, 409],
      }),
    })
    .delete(
      '/:id',
      async ({ params, set }) => {
        await CategoryService.remove(params.id)
        set.status = 204
      },
      {
        permission: PostPermissions.WRITE_ALL,
        params: CategoryIdParamsSchema,
        detail: apiDetail({
          summary: '删除分类',
          description: '删除指定分类，已关联文章会保留并清空分类。',
          successStatus: 204,
          responseDescription: '分类删除成功',
          errors: [401, 403, 404],
        }),
      },
    )
}

export * from './constants'
export * from './model'
export { CategoryRepository }
export { CategoryService }
export * from './types'
