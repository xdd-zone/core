import type { ResolvedConfig } from './types'

export const DEFAULT_CONFIG: Omit<ResolvedConfig, 'env' | 'betterAuth' | 'database'> = {
  app: {
    name: 'XDD SPACE API',
    port: 7788,
    apiPrefix: '/api',
    publicBaseUrl: 'http://localhost:7788',
  },
  http: {
    cors: {
      enabled: true,
      origins: ['http://localhost:2333', 'http://localhost:2233', 'http://localhost:7788'],
      allowCredentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Length', 'X-Requested-With'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      maxAge: 86400,
    },
    requestLogger: {
      enabled: true,
      logBody: false,
      logHeaders: false,
    },
  },
  openapi: {
    enabled: true,
    path: '/openapi',
    title: 'XDD SPACE API',
    description: 'XDD SPACE API documentation',
    version: '1.0.0',
  },
  logger: {
    level: 'info',
    pretty: true,
    serviceName: 'xdd-server-elysia',
  },
  auth: {
    trustedOrigins: [
      'http://localhost:2333',
      'http://localhost:2233',
      'http://localhost:7788',
      'http://localhost:7789',
      'http://elysia.xdd.ink',
      'https://elysia.xdd.ink',
    ],
    methods: {
      emailPassword: {
        enabled: false,
        allowSignUp: false,
      },
      github: {
        enabled: true,
        allowSignUp: true,
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
}
