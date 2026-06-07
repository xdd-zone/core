import type { HealthResponse } from '@xdd-zone/contracts'
import type { HonoEnv } from '../../shared/hono-env'
import { buildSuccess } from '@xdd-zone/contracts'
import { Hono } from 'hono'

import { getNexusEnv } from '../../shared/env'
import { createMeta } from '../../shared/meta'

const healthRoute = new Hono<HonoEnv>().get('/', (c) => {
  const env = getNexusEnv()
  const data: HealthResponse = {
    env: env.APP_ENV,
    service: 'nexus',
    status: 'ok',
  }

  return c.json(buildSuccess(data, createMeta()))
})

export default healthRoute
