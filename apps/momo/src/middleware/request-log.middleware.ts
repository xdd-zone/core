import type { MomoEnv } from '#momo/shared/env'
import type { HonoEnv } from '#momo/shared/hono-env'
import type { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'

export function createRequestLogMiddleware(env: MomoEnv) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    await next()

    if (env.APP_ENV === 'test') {
      return
    }

    const elapsed = Date.now() - c.var.startedAt
    const pathname = new URL(c.req.url).pathname

    console.warn(
      `${c.req.method} ${pathname} ${c.res.status} ${elapsed}ms requestId=${c.var.requestId}`,
    )
  })
}

export function registerRequestLog(app: Hono<HonoEnv>, env: MomoEnv): void {
  app.use('*', createRequestLogMiddleware(env))
}
