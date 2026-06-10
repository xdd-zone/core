import type { MomoEnv } from '#momo/shared/env'
import type { HonoEnv } from '#momo/shared/hono-env'
import type { Hono } from 'hono'
import { cors } from 'hono/cors'

export function registerCors(app: Hono<HonoEnv>, env: MomoEnv): void {
  app.use(
    '*',
    cors({
      allowHeaders: ['content-type'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      origin: env.CORS_ORIGINS,
    }),
  )
}
