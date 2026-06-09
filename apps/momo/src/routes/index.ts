import type { HonoEnv } from '#momo/shared/hono-env'
import systemRoute from '#momo/modules/system/system.route'
import { Hono } from 'hono'

const routes = new Hono<HonoEnv>().route('/', systemRoute)

export type RoutesType = typeof routes

export default routes
