import type { ResolvedConfig } from '../config'
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { createOpenapiPlugin } from './openapi.plugin'

function createConfig(openapi: Partial<ResolvedConfig['openapi']> = {}): ResolvedConfig {
  return {
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
        enabled: false,
        origins: [],
        allowCredentials: true,
        allowedHeaders: [],
        exposedHeaders: [],
        methods: ['GET'],
        maxAge: 0,
      },
      requestLogger: {
        enabled: false,
        logBody: false,
        logHeaders: false,
      },
    },
    openapi: {
      enabled: true,
      path: '/openapi',
      title: 'XDD Test API',
      description: 'XDD Test API',
      version: '1.0.0',
      ...openapi,
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
}

describe('createOpenapiPlugin', () => {
  it('enabled=true 时应在配置的 path 下提供 OpenAPI JSON', async () => {
    const app = new Elysia().use(createOpenapiPlugin(createConfig({ path: '/docs' }))).get('/ping', () => ({
      ok: true,
    }))

    const response = await app.handle(new Request('http://localhost/docs/json'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.info).toMatchObject({
      title: 'XDD Test API',
      description: 'XDD Test API',
      version: '1.0.0',
    })
    expect(body.paths).toHaveProperty('/ping')
  })

  it('enabled=false 时不应提供 OpenAPI JSON', async () => {
    const app = new Elysia().use(createOpenapiPlugin(createConfig({ enabled: false, path: '/docs' })))

    const response = await app.handle(new Request('http://localhost/docs/json'))

    expect(response.status).toBe(404)
  })

  it('path 改到 /docs 后不应继续响应默认 /openapi/json', async () => {
    const app = new Elysia().use(createOpenapiPlugin(createConfig({ path: '/docs' })))

    const response = await app.handle(new Request('http://localhost/openapi/json'))

    expect(response.status).toBe(404)
  })
})
