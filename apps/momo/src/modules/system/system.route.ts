import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'
import { zValidator } from '@hono/zod-validator'
import { PingRequestSchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'

import { getHealthStatus, getRootInfo, pingSystem } from './system.service'

export function createSystemRoute(runtime: MomoRuntime) {
  return new Hono<HonoEnv>()
    .get('/', (c) => {
      return c.json(createSuccessResponse(getRootInfo(), createMeta(c.var.requestId)))
    })
    .get('/health', (c) => {
      return c.json(createSuccessResponse(getHealthStatus(runtime.env), createMeta(c.var.requestId)))
    })
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
