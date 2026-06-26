import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import { PublicPostListQuerySchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { getDb } from '#momo/infra/db/client'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'

import { createContentRepository } from './repositories/content.repository'
import { createTaxonomyRepository } from './repositories/taxonomy.repository'
import { createPublicContentService } from './services/public-content.service'

export function createPublicContentRoute() {
  const repository = createContentRepository(getDb())
  const taxonomyRepository = createTaxonomyRepository(getDb())
  const service = createPublicContentService(repository, taxonomyRepository)

  return new Hono<HonoEnv>()
    .get(
      '/rpc/bobo/content/posts',
      zValidator('query', PublicPostListQuerySchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const data = await service.listPosts(c.req.valid('query'))
        return c.json(createSuccessResponse(data, createMeta(c.var.requestId)))
      },
    )
    .get('/rpc/bobo/content/posts/:slug', async (c) => {
      const post = await service.getPostBySlug(c.req.param('slug'))
      return c.json(createSuccessResponse({ post }, createMeta(c.var.requestId)))
    })
    .get('/rpc/bobo/content/categories', async (c) => {
      const categories = await service.listCategories()
      return c.json(createSuccessResponse({ categories }, createMeta(c.var.requestId)))
    })
    .get('/rpc/bobo/content/tags', async (c) => {
      const tags = await service.listTags()
      return c.json(createSuccessResponse({ tags }, createMeta(c.var.requestId)))
    })
}
