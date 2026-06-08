import type { HonoEnv } from '#nexus/shared/hono-env'
import systemRoute from '#nexus/modules/system/system.route'
import { Hono } from 'hono'

const routes = new Hono<HonoEnv>().route('/', systemRoute)

export type RoutesType = typeof routes

export default routes
