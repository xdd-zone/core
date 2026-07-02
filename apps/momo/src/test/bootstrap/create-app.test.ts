import type { Logger } from 'pino'
import type { MomoRuntime } from '#momo/bootstrap'
import type { CacheDriver } from '#momo/infra/cache'
import type { SearchDriver } from '#momo/infra/search'
import type { StorageDriver } from '#momo/infra/storage'
import { BizCode } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { createMomoApp } from '#momo/bootstrap'

function createRuntime(appEnv: MomoRuntime['env']['APP_ENV'] = 'test'): MomoRuntime {
  const mockLogger = {
    child: vi.fn(() => mockLogger),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }

  return {
    boboRevalidate: {
      revalidate: vi.fn(),
    },
    env: {
      APP_ENV: appEnv,
      BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      BETTER_AUTH_URL: 'http://localhost:7788',
      BOBO_BASE_URL: undefined,
      BOBO_REVALIDATE_SECRET: undefined,
      CACHE_DEFAULT_TTL_SECONDS: 300,
      CACHE_KEY_PREFIX: 'momo',
      CACHE_PROVIDER: 'memory',
      CACHE_URL: undefined,
      CORS_ORIGINS: ['http://localhost:2333'],
      DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
      GITHUB_CLIENT_ID: 'test-github-client-id',
      GITHUB_CLIENT_SECRET: 'test-github-client-secret',
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
      LLM_SECRET_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      MEILI_API_KEY: undefined,
      MEILI_HOST: undefined,
      MEILI_INDEX_PREFIX: 'momo',
      MOMO_PUBLIC_BASE_URL: 'http://localhost:7788',
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
      SEARCH_PROVIDER: 'none',
      STORAGE_PROVIDER: 'local',
    },
    logger: mockLogger as unknown as Logger,
    cache: {
      close: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      wrap: vi.fn(),
    } as unknown as CacheDriver,
    search: {
      addDocuments: vi.fn(),
      close: vi.fn(),
      deleteDocument: vi.fn(),
      deleteDocuments: vi.fn(),
      health: vi.fn(),
      search: vi.fn(),
      updateSettings: vi.fn(),
    } as unknown as SearchDriver,
    storage: {
      openFile: vi.fn(),
      remove: vi.fn(),
      save: vi.fn(),
      stat: vi.fn(),
    } as unknown as StorageDriver,
  }
}

describe('momo 应用创建', () => {
  it('runtime logger 创建模块 logger', () => {
    const runtime = createRuntime()

    createMomoApp(runtime)

    expect(runtime.logger.child).toHaveBeenCalledWith({ module: 'http' })
    expect(runtime.logger.child).toHaveBeenCalledWith({ module: 'db' })
    expect(runtime.logger.child).toHaveBeenCalledWith({ module: 'auth' })
  })

  it('request id 未处理错误会被记录', async () => {
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

  it('development 环境的未处理错误日志带 stack', async () => {
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

  it('production 环境添加 HSTS', async () => {
    const runtime = createRuntime('production')
    const app = createMomoApp(runtime)
    const response = await app.request('/health')

    expect(response.headers.get('strict-transport-security')).toBe('max-age=15552000; includeSubDomains')
  })

  it('rpc 请求超时时返回上游超时响应', async () => {
    vi.useFakeTimers()

    try {
      const runtime = createRuntime()
      const app = createMomoApp(runtime)

      app.route(
        '/',
        new Hono().get('/rpc/slow', async () => {
          await new Promise(() => undefined)
          return new Response('never')
        }),
      )

      const responsePromise = app.request('/rpc/slow')
      await vi.advanceTimersByTimeAsync(5000)

      const response = await responsePromise
      const body = (await response.json()) as { ok: false; error: { code: string; message: string } }

      expect(response.status).toBe(504)
      expect(body.ok).toBe(false)
      expect(body.error.code).toBe(BizCode.SYSTEM_UPSTREAM_TIMEOUT)
      expect(body.error.message).toBe('请求处理超时')
    } finally {
      vi.useRealTimers()
    }
  })
})
