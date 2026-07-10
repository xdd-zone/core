import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import { EventOutboxListQuerySchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { getDb } from '#momo/infra/db/client'
import { createRequireFifaOwner } from '#momo/modules/auth/index'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'

import { createEventsRepository } from './events.repository'
import { createEventsService } from './events.service'

export function createEventsRoute(runtime: MomoRuntime) {
  const service = createEventsService(runtime, createEventsRepository(getDb()))
  const requireOwner = createRequireFifaOwner(runtime)

  return new Hono<HonoEnv>()
    .get(
      '/rpc/events/outbox',
      requireOwner,
      zValidator('query', EventOutboxListQuerySchema, (result) => {
        if (result.success) return
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const result = await service.listOutboxEvents(c.req.valid('query'))
        return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
      },
    )
    .get('/rpc/events/outbox/:eventId', requireOwner, async (c) => {
      const result = await service.getOutboxEvent(c.req.param('eventId'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .post('/rpc/events/outbox/retry', requireOwner, async (c) => {
      const result = await service.retryPending()
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .post('/rpc/events/outbox/:eventId/retry', requireOwner, async (c) => {
      const result = await service.retryEvent(c.req.param('eventId'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
}
