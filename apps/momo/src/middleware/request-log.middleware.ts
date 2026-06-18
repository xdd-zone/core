import type { Hono } from 'hono'
import type { MomoLogger } from '#momo/infra/logger'
import type { HonoEnv } from '#momo/shared/hono-env'
import { createMiddleware } from 'hono/factory'

export const SLOW_REQUEST_THRESHOLD_MS = 1000

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

    const status = c.res.status

    if (status >= 500) {
      logger.error(payload, '请求返回 5xx')
      return
    }

    if (status === 401 || status === 403 || status === 404) {
      logger.info(payload, '请求未通过')
      return
    }

    if (status >= 400) {
      logger.warn(payload, '请求参数错误')
      return
    }

    if (durationMs >= SLOW_REQUEST_THRESHOLD_MS) {
      logger.warn(payload, '请求耗时较长')
      return
    }

    logger.info(payload, '请求完成')
  })
}

export function registerRequestLog(app: Hono<HonoEnv>, logger: MomoLogger): void {
  app.use('*', createRequestLogMiddleware(logger))
}
