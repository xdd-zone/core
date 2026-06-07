import type { HealthResponse } from '@xdd-zone/contracts'
import type { HonoEnv } from '../../shared/hono-env'
import { buildSuccess } from '@xdd-zone/contracts'
import { Hono } from 'hono'

import { createMeta } from '../../shared/meta'

const healthRoute = new Hono<HonoEnv>().get('/', (c) => {
  const data: HealthResponse = {
    service: 'nexus',
    status: 'ok',
  }

  return c.json(buildSuccess(data, createMeta()))
})

export default healthRoute
