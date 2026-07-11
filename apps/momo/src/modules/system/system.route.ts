import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import { PingRequestSchema, SystemLogListQuerySchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { createRequireFifaOwner } from '#momo/modules/auth/index'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'

import { getHealthStatus, getReadinessStatus, getRootInfo, getSystemLogs, pingSystem } from './system.service'

export function createSystemRoute(runtime: MomoRuntime) {
  const requireOwner = createRequireFifaOwner(runtime)

  return new Hono<HonoEnv>()
    .get('/', (c) => {
      return c.json(createSuccessResponse(getRootInfo(), createMeta(c.var.requestId)))
    })
    .get('/health', (c) => {
      return c.json(createSuccessResponse(getHealthStatus(runtime.env), createMeta(c.var.requestId)))
    })
    .get('/rpc/system/readiness', requireOwner, async (c) => {
      const result = await getReadinessStatus(runtime)
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .get(
      '/rpc/system/logs',
      requireOwner,
      zValidator('query', SystemLogListQuerySchema, (result) => {
        if (result.success) return

        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const result = await getSystemLogs(runtime, c.req.valid('query'))
        return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
      },
    )
    .post(
      '/rpc/system/ping',
      zValidator('json', PingRequestSchema, (result) => {
        if (result.success) {
          return
        }

        const failure = createValidationFailure(result.error)

        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      (c) => {
        const payload = c.req.valid('json')

        return c.json(createSuccessResponse(pingSystem(runtime.env, payload.name), createMeta(c.var.requestId)))
      },
    )
}

export default createSystemRoute
