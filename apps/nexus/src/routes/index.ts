import type { HonoEnv } from '../shared/hono-env'
import { Hono } from 'hono'

import healthRoute from './system/health.route'
import pingRoute from './system/ping.route'
import rootRoute from './system/root.route'

const routes = new Hono<HonoEnv>()
  .route('/', rootRoute)
  .route('/health', healthRoute)
  .route('/rpc/system/ping', pingRoute)

export type RoutesType = typeof routes

export default routes
