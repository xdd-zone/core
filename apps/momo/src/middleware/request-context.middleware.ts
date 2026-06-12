import type { HonoEnv } from '#momo/shared/hono-env'
import type { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'

export const requestContextMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  c.set('startedAt', performance.now())

  await next()
})

export function registerRequestContext(app: Hono<HonoEnv>): void {
  app.use('*', requestContextMiddleware)
}
