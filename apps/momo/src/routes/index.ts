import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { Hono } from 'hono'
import { createAuthRoute } from '#momo/modules/auth/index'
import { createContentRoute, createPublicContentRoute } from '#momo/modules/content/index'
import { createLlmRoute } from '#momo/modules/llm/index'
import { createProfileRoute } from '#momo/modules/profile/index'
import { createSystemRoute } from '#momo/modules/system/system.route'

export function createRoutes(runtime: MomoRuntime) {
  return new Hono<HonoEnv>()
    .route('/', createAuthRoute(runtime))
    .route('/', createContentRoute(runtime))
    .route('/', createPublicContentRoute())
    .route('/', createLlmRoute(runtime))
    .route('/', createProfileRoute(runtime))
    .route('/', createSystemRoute(runtime))
}

export type MomoRpcType = ReturnType<typeof createRoutes>

export default createRoutes
