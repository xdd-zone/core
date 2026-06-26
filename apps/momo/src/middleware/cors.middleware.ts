import type { Hono } from 'hono'
import type { MomoEnv } from '#momo/shared/env'
import type { HonoEnv } from '#momo/shared/hono-env'
import { cors } from 'hono/cors'

export function registerCors(app: Hono<HonoEnv>, env: MomoEnv): void {
  app.use(
    '*',
    cors({
      allowHeaders: ['content-type', 'x-request-id'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
      exposeHeaders: ['x-request-id'],
      origin: env.CORS_ORIGINS,
    }),
  )
}
