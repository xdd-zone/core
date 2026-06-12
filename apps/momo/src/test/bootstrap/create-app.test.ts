import type { MomoRuntime } from '#momo/bootstrap'
import type { StorageDriver } from '#momo/infra/storage'
import type { Logger } from 'pino'
import { createMomoApp } from '#momo/bootstrap'
import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'

function createRuntime(appEnv: MomoRuntime['env']['APP_ENV'] = 'test'): MomoRuntime {
  const mockLogger = {
    child: vi.fn(() => mockLogger),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }

  return {
    env: {
      APP_ENV: appEnv,
      BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      BETTER_AUTH_URL: 'http://localhost:7788',
      CORS_ORIGINS: ['http://localhost:2333'],
      DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
      GITHUB_CLIENT_ID: 'test-github-client-id',
      GITHUB_CLIENT_SECRET: 'test-github-client-secret',
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
      COS_BUCKET: undefined,
      COS_KEY_PREFIX: 'media',
      COS_PUBLIC_BASE_URL: undefined,
      COS_REGION: undefined,
      COS_SECRET_ID: undefined,
      COS_SECRET_KEY: undefined,
      COS_SIGNED_URL_EXPIRES: 600,
      LOCAL_STORAGE_DIR: undefined,
      LOG_LEVEL: appEnv === 'test' ? 'silent' : 'info',
      LOG_SQL: false,
      PORT: 7788,
      STORAGE_PROVIDER: 'local',
    },
    logger: mockLogger as unknown as Logger,
    storage: {
      openFile: vi.fn(),
      remove: vi.fn(),
      save: vi.fn(),
    } as unknown as StorageDriver,
  }
}

describe('create momo app', () => {
  it('creates module loggers from runtime logger', () => {
    const runtime = createRuntime()

    createMomoApp(runtime)

    expect(runtime.logger.child).toHaveBeenCalledWith({ module: 'http' })
    expect(runtime.logger.child).toHaveBeenCalledWith({ module: 'db' })
    expect(runtime.logger.child).toHaveBeenCalledWith({ module: 'auth' })
  })

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

  it('adds stack to unhandled error logs in development', async () => {
    const runtime = createRuntime('development')
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
        errorStack: expect.stringContaining('Error: boom'),
      }),
      '请求处理失败',
    )
  })
})
