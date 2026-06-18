import type { Hono } from 'hono'
import type { HonoEnv } from '#momo/shared/hono-env'
import { createMiddleware } from 'hono/factory'

export const REQUEST_ID_HEADER = 'X-Request-Id'

export const requestContextMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const requestId = resolveRequestId(c.req.header(REQUEST_ID_HEADER))

  c.set('requestId', requestId)
  c.set('startedAt', performance.now())
  c.header(REQUEST_ID_HEADER, requestId)

  await next()
})

export function registerRequestContext(app: Hono<HonoEnv>): void {
  app.use('*', requestContextMiddleware)
}

export function resolveRequestId(value: string | undefined): string {
  if (value && isValidRequestId(value)) {
    return value
  }

  return crypto.randomUUID()
}

function isValidRequestId(value: string): boolean {
  return /^[\w.:-]{1,128}$/.test(value)
}
