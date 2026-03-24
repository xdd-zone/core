import { randomUUID } from 'node:crypto'
import { createModuleLogger } from '@nexus/infra/logger'
import { Elysia } from 'elysia'

const httpLogger = createModuleLogger('http')
const requestStartTimes = new WeakMap<Request, number>()
const requestIds = new WeakMap<Request, string>()

/**
 * 轻量请求日志插件。
 */
export const requestLoggerPlugin = new Elysia({ name: 'request-logger' })
  .onRequest(({ request }) => {
    const url = new URL(request.url)
    const requestId = randomUUID()
    const forwarded = request.headers.get('x-forwarded-for')
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : undefined
    const userAgent = request.headers.get('user-agent') ?? undefined

    requestStartTimes.set(request, Date.now())
    requestIds.set(request, requestId)

    httpLogger.info(
      {
        requestId,
        method: request.method,
        path: url.pathname,
        query: url.search || undefined,
        ip: clientIp,
        userAgent,
      },
      'request start',
    )
  })
  .onAfterResponse(({ request, set }) => {
    const url = new URL(request.url)
    const startTime = requestStartTimes.get(request)
    const requestId = requestIds.get(request)

    httpLogger.info(
      {
        requestId,
        method: request.method,
        path: url.pathname,
        status: typeof set.status === 'number' ? set.status : 200,
        duration: startTime ? Date.now() - startTime : undefined,
      },
      'request completed',
    )
  })
