import type { MomoLogger } from '#momo/infra/logger'
import type { HonoEnv } from '#momo/shared/hono-env'
import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRequestLogMiddleware } from '#momo/middleware'

function createMockLogger() {
  return {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  } as unknown as MomoLogger
}

function createApp(logger: MomoLogger, status: 200 | 301 | 400 | 401 | 403 | 404 | 500, startedAt = performance.now()) {
  const app = new Hono<HonoEnv>()

  app.use('*', async (c, next) => {
    c.set('requestId', 'test-request-id')
    c.set('startedAt', startedAt)
    await next()
  })
  app.use('*', createRequestLogMiddleware(logger))
  app.get('/demo', (c) => c.text('ok', status))

  return app
}

describe('request log 中间件', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('completed 请求字段会被记录', async () => {
    const logger = createMockLogger()
    const app = createApp(logger, 200)

    await app.request('/demo?ignored=true')

    expect(logger.info).toHaveBeenCalledTimes(1)
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'http.request.completed',
        method: 'GET',
        path: '/demo',
        requestId: 'test-request-id',
        status: 200,
        durationMs: expect.any(Number),
      }),
      '请求完成',
    )
  })

  it.each([401, 403, 404] as const)('expected %i 响应使用 info 级别', async (status) => {
    const logger = createMockLogger()
    const app = createApp(logger, status)

    await app.request('/demo')

    expect(logger.info).toHaveBeenCalledWith(expect.any(Object), '请求未通过')
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it.each([200, 301] as const)('slow %i 响应使用 warn 级别', async (status) => {
    const logger = createMockLogger()
    const now = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const app = createApp(logger, status, 0)

    await app.request('/demo')

    expect(now).toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 1000, status }), '请求耗时较长')
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('unexpected 客户端错误使用 warn 级别', async () => {
    const logger = createMockLogger()
    const app = createApp(logger, 400)

    await app.request('/demo')

    expect(logger.warn).toHaveBeenCalledWith(expect.any(Object), '请求参数错误')
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('server 错误使用 error 级别', async () => {
    const logger = createMockLogger()
    const app = createApp(logger, 500)

    await app.request('/demo')

    expect(logger.error).toHaveBeenCalledWith(expect.any(Object), '请求返回 5xx')
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
