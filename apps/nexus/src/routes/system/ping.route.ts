import type { PingResponse } from '@xdd-zone/contracts'
import type { HonoEnv } from '../../shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import { BizCode, buildFailure, buildSuccess, PingRequestSchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { z } from 'zod'

import { getNexusEnv } from '../../shared/env'
import { createMeta } from '../../shared/meta'

const pingRoute = new Hono<HonoEnv>().post(
  '/',
  zValidator('json', PingRequestSchema, (result, c) => {
    if (result.success) {
      return
    }

    return c.json(
      buildFailure(
        {
          code: BizCode.COMMON_INVALID_REQUEST,
          message: '请求参数不正确',
          details: z.flattenError(result.error),
        },
        createMeta(),
      ),
      400,
    )
  }),
  async (c) => {
    const payload = c.req.valid('json')

    const env = getNexusEnv()
    const data: PingResponse = {
      env: env.APP_ENV,
      service: 'nexus',
      message: `pong, ${payload.name}`,
    }

    return c.json(buildSuccess(data, createMeta()))
  },
)

export default pingRoute
