import type { MomoLogger } from '#momo/infra/logger'
import { createRequestLogMiddleware, requestContextMiddleware } from '#momo/middleware'
import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'

function createMockLogger() {
  return {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  } as unknown as MomoLogger
}

function createApp(logger: MomoLogger, status: 200 | 404 | 500) {
  const app = new Hono()

  app.use('*', requestContextMiddleware)
  app.use('*', createRequestLogMiddleware(logger))
  app.get('/demo', (c) => c.text('ok', status))

  return app
}

describe('request log middleware', () => {
  it('logs completed request fields', async () => {
    const logger = createMockLogger()
    const app = createApp(logger, 200)

    await app.request('/demo?ignored=true')

    expect(logger.info).toHaveBeenCalledTimes(1)
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'http.request.completed',
        method: 'GET',
        path: '/demo',
        requestId: expect.any(String),
        status: 200,
        durationMs: expect.any(Number),
      }),
      '请求完成',
    )
  })

  it('uses warn level for client errors', async () => {
    const logger = createMockLogger()
    const app = createApp(logger, 404)

    await app.request('/demo')

    expect(logger.warn).toHaveBeenCalledWith(expect.any(Object), '请求返回 4xx')
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('uses error level for server errors', async () => {
    const logger = createMockLogger()
    const app = createApp(logger, 500)

    await app.request('/demo')

    expect(logger.error).toHaveBeenCalledWith(expect.any(Object), '请求返回 500')
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
