import type { RootResponse } from '@xdd-zone/contracts'
import type { HonoEnv } from '../../shared/hono-env'
import { buildSuccess } from '@xdd-zone/contracts'
import { Hono } from 'hono'

import { createMeta } from '../../shared/meta'

const rootRoute = new Hono<HonoEnv>().get('/', (c) => {
  const data: RootResponse = {
    name: '@xdd-zone/nexus',
    status: 'ok',
  }

  return c.json(buildSuccess(data, createMeta()))
})

export default rootRoute
