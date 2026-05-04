import type { AccessPluginInstance } from '@nexus/core'

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
import { CategoryOpenApi } from './openapi'
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
      detail: CategoryOpenApi.list,
    })
    .post('/', async ({ body }) => await CategoryService.create(body), {
      permission: PostPermissions.WRITE_ALL,
      body: CreateCategoryBodySchema,
      response: CategorySchema,
      detail: CategoryOpenApi.create,
    })
    .get('/:id', async ({ params }) => await CategoryService.findById(params.id), {
      permission: { any: CATEGORY_MANAGE_PERMISSIONS },
      params: CategoryIdParamsSchema,
      response: CategorySchema,
      detail: CategoryOpenApi.findById,
    })
    .patch('/:id', async ({ body, params }) => await CategoryService.update(params.id, body), {
      permission: PostPermissions.WRITE_ALL,
      params: CategoryIdParamsSchema,
      body: UpdateCategoryBodySchema,
      response: CategorySchema,
      detail: CategoryOpenApi.update,
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
        detail: CategoryOpenApi.remove,
      },
    )
}
