import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { Hono } from 'hono'
import { getDb } from '#momo/infra/db/client'
import { createRequirePermission } from '#momo/modules/auth/index'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'

import { createEventsRepository } from './events.repository'
import { createEventsService } from './events.service'

export function createEventsRoute(runtime: MomoRuntime) {
  const service = createEventsService(runtime, createEventsRepository(getDb()))

  return new Hono<HonoEnv>().post(
    '/rpc/events/outbox/retry',
    createRequirePermission(runtime, 'events.outbox.retry'),
    async (c) => {
      const result = await service.retryPending()
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    },
  )
}
