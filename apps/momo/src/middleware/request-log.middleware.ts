import type { MomoLogger } from '#momo/infra/logger'
import type { HonoEnv } from '#momo/shared/hono-env'
import type { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'

export function createRequestLogMiddleware(logger: MomoLogger) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    await next()

    const durationMs = Math.round((performance.now() - c.var.startedAt) * 100) / 100
    const pathname = new URL(c.req.url).pathname
    const payload = {
      durationMs,
      event: 'http.request.completed',
      method: c.req.method,
      path: pathname,
      requestId: c.var.requestId,
      status: c.res.status,
    }

    if (c.res.status >= 500) {
      logger.error(payload, '请求返回 500')
      return
    }

    if (c.res.status >= 400) {
      logger.warn(payload, '请求返回 4xx')
      return
    }

    logger.info(payload, '请求完成')
  })
}

export function registerRequestLog(app: Hono<HonoEnv>, logger: MomoLogger): void {
  app.use('*', createRequestLogMiddleware(logger))
}
