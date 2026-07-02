import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { Hono } from 'hono'
import { createAssetsRoute } from '#momo/modules/assets/index'
import { createAuthRoute } from '#momo/modules/auth/index'
import { createContentRoute, createPublicContentRoute } from '#momo/modules/content/index'
import { createEventsRoute } from '#momo/modules/events/index'
import { createLlmRoute } from '#momo/modules/llm/index'
import { createPreviewRoute } from '#momo/modules/preview/index'
import { createProfileRoute } from '#momo/modules/profile/index'
import { createProjectsRoute } from '#momo/modules/projects/index'
import { createSearchRoute } from '#momo/modules/search/index'
import { createSiteRoute } from '#momo/modules/site/index'
import { createSystemRoute } from '#momo/modules/system/system.route'

export function createRoutes(runtime: MomoRuntime) {
  return new Hono<HonoEnv>()
    .route('/', createAuthRoute(runtime))
    .route('/', createAssetsRoute(runtime))
    .route('/', createContentRoute(runtime))
    .route('/', createPublicContentRoute())
    .route('/', createEventsRoute(runtime))
    .route('/', createLlmRoute(runtime))
    .route('/', createProfileRoute(runtime))
    .route('/', createPreviewRoute())
    .route('/', createProjectsRoute(runtime))
    .route('/', createSearchRoute(runtime))
    .route('/', createSiteRoute(runtime))
    .route('/', createSystemRoute(runtime))
}

export type MomoRpcType = ReturnType<typeof createRoutes>

export default createRoutes
