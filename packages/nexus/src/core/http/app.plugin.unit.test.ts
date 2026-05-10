import type { ResolvedConfig } from '../config'
import type { Logger } from '../../infra/logger'
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { setupAppPlugin } from './app.plugin'

interface MockLoggerCalls {
  childContexts: Array<Record<string, unknown>>
  debug: Array<[unknown, string]>
  error: Array<[unknown, string]>
  info: Array<[unknown, string]>
  warn: Array<[unknown, string]>
  waitForInfoMessage(message: string): Promise<void>
}

function createConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  const config: ResolvedConfig = {
    env: {
      nodeEnv: 'test',
      isDevelopment: false,
      isTest: true,
      isProduction: false,
    },
    app: {
      name: 'XDD Test API',
      port: 7788,
      apiPrefix: '/api',
      publicBaseUrl: 'http://localhost:7788',
    },
    http: {
      cors: {
        enabled: true,
        origins: ['http://console.example.com'],
        allowCredentials: true,
        allowedHeaders: ['Content-Type'],
        exposedHeaders: ['Content-Length'],
        methods: ['GET', 'POST'],
        maxAge: 60,
      },
      requestLogger: {
        enabled: true,
        logBody: false,
        logHeaders: false,
      },
    },
    openapi: {
      enabled: true,
      path: '/docs',
      title: 'XDD Test API',
      description: 'XDD Test API',
      version: '1.0.0',
    },
    logger: {
      level: 'silent',
      pretty: false,
      serviceName: 'xdd-server-elysia',
    },
    storage: {
      provider: 'local',
    },
    auth: {
      trustedOrigins: [],
      methods: {
        emailPassword: {
          enabled: false,
          allowSignUp: false,
        },
        github: {
          enabled: false,
          allowSignUp: false,
        },
        google: {
          enabled: false,
          allowSignUp: false,
        },
        wechat: {
          enabled: false,
          allowSignUp: false,
        },
      },
    },
    betterAuth: {
      secret: 'a'.repeat(32),
      url: 'http://localhost:7788',
      providers: {},
    },
    database: {
      url: 'postgresql://user:pass@localhost:5432/xdd',
      log: {
        query: false,
        info: false,
        warn: false,
        error: false,
      },
    },
  }

  return {
    ...config,
    ...overrides,
    http: {
      ...config.http,
      ...overrides.http,
      cors: {
        ...config.http.cors,
        ...overrides.http?.cors,
      },
      requestLogger: {
        ...config.http.requestLogger,
        ...overrides.http?.requestLogger,
      },
    },
    openapi: {
      ...config.openapi,
      ...overrides.openapi,
    },
  }
}

function createMockLogger() {
  const infoWaiters = new Map<string, Array<() => void>>()
  const calls: MockLoggerCalls = {
    childContexts: [],
    debug: [],
    error: [],
    info: [],
    warn: [],
    waitForInfoMessage(message: string) {
      if (calls.info.some(([, currentMessage]) => currentMessage === message)) return Promise.resolve()

      return new Promise((resolve) => {
        const waiters = infoWaiters.get(message) ?? []
        waiters.push(resolve)
        infoWaiters.set(message, waiters)
      })
    },
  }

  const childLogger = {
    debug(payload: unknown, message: string) {
      calls.debug.push([payload, message])
    },
    error(payload: unknown, message: string) {
      calls.error.push([payload, message])
    },
    info(payload: unknown, message: string) {
      calls.info.push([payload, message])
      const waiters = infoWaiters.get(message) ?? []
      infoWaiters.delete(message)
      for (const resolve of waiters) resolve()
    },
    warn(payload: unknown, message: string) {
      calls.warn.push([payload, message])
    },
  }

  const baseLogger = {
    child(context: Record<string, unknown>) {
      calls.childContexts.push(context)
      return childLogger
    },
  } as unknown as Logger

  return {
    baseLogger,
    calls,
  }
}

describe('setupAppPlugin', () => {
  it('应装配 CORS、OpenAPI、错误处理和请求日志插件', async () => {
    const { baseLogger, calls } = createMockLogger()
    const app = setupAppPlugin(new Elysia(), createConfig(), baseLogger).get('/ok', () => ({
      ok: true,
    }))

    const okResponse = await app.handle(
      new Request('http://localhost/ok', {
        headers: {
          origin: 'http://console.example.com',
        },
      }),
    )

    expect(okResponse.status).toBe(200)
    expect(okResponse.headers.get('access-control-allow-origin')).toBe('http://console.example.com')
    expect(await okResponse.json()).toEqual({ ok: true })
    await calls.waitForInfoMessage('request completed')
    expect(calls.childContexts).toEqual([{ module: 'error' }, { module: 'http' }])
    expect(calls.info.map(([, message]) => message)).toEqual(['request start', 'request completed'])

    const openapiResponse = await app.handle(new Request('http://localhost/docs/json'))
    expect(openapiResponse.status).toBe(200)
  })

  it('requestLogger.enabled=false 时不应注册 HTTP 请求日志', async () => {
    const { baseLogger, calls } = createMockLogger()
    const app = setupAppPlugin(
      new Elysia(),
      createConfig({
        http: {
          requestLogger: {
            enabled: false,
          },
        } as ResolvedConfig['http'],
      }),
      baseLogger,
    ).get('/ok', () => ({ ok: true }))

    const response = await app.handle(new Request('http://localhost/ok'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(calls.childContexts).toEqual([{ module: 'error' }])
    expect(calls.info).toEqual([])
  })
})
