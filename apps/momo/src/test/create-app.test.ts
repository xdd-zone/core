import type { MomoRuntime } from '#momo/bootstrap'
import type { Logger } from 'pino'
import { createMomoApp } from '#momo/bootstrap'
import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'

function createRuntime(): MomoRuntime {
  const mockLogger = {
    child: vi.fn(() => mockLogger),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }

  return {
    env: {
      APP_ENV: 'test',
      BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      BETTER_AUTH_URL: 'http://localhost:7788',
      CORS_ORIGINS: ['http://localhost:2333'],
      DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
      GITHUB_CLIENT_ID: 'test-github-client-id',
      GITHUB_CLIENT_SECRET: 'test-github-client-secret',
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
      PORT: 7788,
    },
    logger: mockLogger as unknown as Logger,
  }
}

describe('create momo app', () => {
  it('logs unhandled errors with request id', async () => {
    const runtime = createRuntime()
    const app = createMomoApp(runtime)
    const boom = new Error('boom')

    app.route(
      '/',
      new Hono().get('/boom', () => {
        throw boom
      }),
    )

    await app.request('/boom')

    expect(runtime.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: 'boom',
        errorName: 'Error',
        event: 'http.request.failed',
        requestId: expect.any(String),
      }),
      '请求处理失败',
    )
  })
})
