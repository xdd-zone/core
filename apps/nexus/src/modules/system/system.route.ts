import type { HonoEnv } from '#nexus/shared/hono-env'
import { createFailureResponse, createSuccessResponse } from '#nexus/shared/response'
import { createValidationFailure } from '#nexus/shared/validator'
import { zValidator } from '@hono/zod-validator'
import { PingRequestSchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'

import { getHealthStatus, getRootInfo, pingSystem } from './system.service'

const systemRoute = new Hono<HonoEnv>()
  .get('/', (c) => {
    return c.json(createSuccessResponse(getRootInfo()))
  })
  .get('/health', (c) => {
    return c.json(createSuccessResponse(getHealthStatus()))
  })
  .post(
    '/rpc/system/ping',
    zValidator('json', PingRequestSchema, (result, c) => {
      if (result.success) {
        return
      }

      return c.json(createFailureResponse(createValidationFailure(result.error)), 400)
    }),
    (c) => {
      const payload = c.req.valid('json')

      return c.json(createSuccessResponse(pingSystem(payload.name)))
    },
  )

export default systemRoute
