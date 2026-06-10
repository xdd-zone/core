import type { HonoEnv } from '#momo/shared/hono-env'
import systemRoute from '#momo/modules/system/system.route'
import { Hono } from 'hono'

const rpcRoutes = new Hono<HonoEnv>().route('/', systemRoute)

export type MomoRpcType = typeof rpcRoutes

export default rpcRoutes
