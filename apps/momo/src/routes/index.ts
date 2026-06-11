import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { createAuthRoute } from '#momo/modules/auth/index'
import { createSystemRoute } from '#momo/modules/system/system.route'
import { Hono } from 'hono'

export function createRoutes(runtime: MomoRuntime) {
  return new Hono<HonoEnv>().route('/', createAuthRoute(runtime)).route('/', createSystemRoute(runtime))
}

export type MomoRpcType = ReturnType<typeof createRoutes>

export default createRoutes
