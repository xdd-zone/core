import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import { PublicSearchQuerySchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'

import { createSearchService } from './search.service'

export function createSearchRoute(runtime: MomoRuntime) {
  const service = createSearchService(runtime)

  return new Hono<HonoEnv>().get(
    '/rpc/bobo/search',
    zValidator('query', PublicSearchQuerySchema, (result) => {
      if (result.success) return
      const failure = createValidationFailure(result.error)
      throw new AppError(failure.code, failure.message, 400, failure.details)
    }),
    async (c) => {
      const result = await service.search(c.req.valid('query').q)
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    },
  )
}
