import type { HonoEnv } from '#momo/shared/hono-env'
import { Hono } from 'hono'
import { getDb } from '#momo/infra/db/client'
import { createContentRepository } from '#momo/modules/content/repositories/content.repository'
import { createTaxonomyRepository } from '#momo/modules/content/repositories/taxonomy.repository'
import { createProjectsRepository } from '#momo/modules/projects/projects.repository'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'

import { createPreviewService } from './preview.service'

export function createPreviewRoute() {
  const service = createPreviewService(
    createContentRepository(getDb()),
    createTaxonomyRepository(getDb()),
    createProjectsRepository(getDb()),
  )

  return new Hono<HonoEnv>().get('/rpc/previews/:token', async (c) => {
    const result = await service.getPreview(c.req.param('token'))
    return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
  })
}
