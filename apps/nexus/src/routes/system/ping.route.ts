import type { PingResponse } from '@xdd-zone/contracts'
import type { HonoEnv } from '../../shared/hono-env'
import { BizCode, buildFailure, buildSuccess, PingRequestSchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'

import { createMeta } from '../../shared/meta'

const pingRoute = new Hono<HonoEnv>().post('/', async (c) => {
  const body = await c.req.json().catch(() => undefined)
  const parsed = PingRequestSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      buildFailure(
        {
          code: BizCode.COMMON_INVALID_REQUEST,
          message: '请求参数不正确',
          details: parsed.error.flatten(),
        },
        createMeta(),
      ),
      400,
    )
  }

  const data: PingResponse = {
    service: 'nexus',
    message: `pong, ${parsed.data.name}`,
  }

  return c.json(buildSuccess(data, createMeta()))
})

export default pingRoute
