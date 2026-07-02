import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import { UpdateSiteConfigRequestSchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { getDb } from '#momo/infra/db/client'
import { createRequirePermission } from '#momo/modules/auth/index'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'

import { createSiteRepository } from './site.repository'
import { createSiteService } from './site.service'

export function createSiteRoute(runtime: MomoRuntime) {
  const service = createSiteService(createSiteRepository(getDb()))

  return new Hono<HonoEnv>()
    .get('/rpc/site/config', createRequirePermission(runtime, 'site.config.read'), async (c) => {
      const site = await service.getSiteConfig('bobo')
      return c.json(createSuccessResponse({ site }, createMeta(c.var.requestId)))
    })
    .patch(
      '/rpc/site/config',
      createRequirePermission(runtime, 'site.config.edit'),
      zValidator('json', UpdateSiteConfigRequestSchema, (result) => {
        if (result.success) return
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const site = await service.updateSiteConfig('bobo', c.req.valid('json'))
        await runtime.boboRevalidate
          .revalidate({
            paths: ['/', '/writing', '/projects', '/sitemap.xml', '/rss.xml'],
            tags: ['site:config', 'site:home', 'site:nav', 'posts:list', 'projects:list'],
          })
          .catch(() => undefined)
        return c.json(createSuccessResponse({ site }, createMeta(c.var.requestId)))
      },
    )
    .get('/rpc/bobo/site/config', async (c) => {
      const site = await service.getSiteConfig('bobo')
      return c.json(createSuccessResponse({ site }, createMeta(c.var.requestId)))
    })
}
