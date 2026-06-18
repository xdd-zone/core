import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { Hono } from 'hono'
import { createAuthRoute } from '#momo/modules/auth/index'
import { createContentRoute } from '#momo/modules/content/content.route'
import { createSystemRoute } from '#momo/modules/system/system.route'

export function createRoutes(runtime: MomoRuntime) {
  return new Hono<HonoEnv>()
    .route('/', createAuthRoute(runtime))
    .route('/', createContentRoute(runtime))
    .route('/', createSystemRoute(runtime))
}

export type MomoRpcType = ReturnType<typeof createRoutes>

export default createRoutes
