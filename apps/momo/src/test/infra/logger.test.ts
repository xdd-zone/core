import type { MomoEnv } from '#momo/shared/env'
import {
  createBetterAuthLogger,
  createChildLogger,
  createErrorLogFields,
  createLogger,
  LOGGER_REDACT_PATHS,
} from '#momo/infra/logger'
import { describe, expect, it, vi } from 'vitest'

const baseEnv: MomoEnv = {
  APP_ENV: 'test',
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
  LOG_LEVEL: 'silent',
  LOG_SQL: false,
  PORT: 7788,
  STORAGE_PROVIDER: 'local',
}

describe('momo logger', () => {
  it('disables logging in test environment', () => {
    const logger = createLogger(baseEnv)

    expect(logger.level).toBe('silent')
    expect(logger.isLevelEnabled('info')).toBe(false)
  })

  it('creates child logger with module field', () => {
    const logger = createLogger({
      ...baseEnv,
      APP_ENV: 'production',
      LOG_LEVEL: 'info',
    })
    const child = createChildLogger(logger, 'http')

    // pino child 的 bindings() 返回绑定到该 child 的字段
    const bindings = (child as unknown as { bindings: () => Record<string, unknown> }).bindings()

    expect(bindings).toEqual(expect.objectContaining({ module: 'http' }))
  })

  it('routes better auth logs through momo logger', () => {
    const logger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }
    const betterAuthLogger = createBetterAuthLogger(
      {
        ...baseEnv,
        APP_ENV: 'development',
        LOG_LEVEL: 'info',
      },
      logger,
    )
    const err = new Error('database failed')

    betterAuthLogger.log('error', 'INTERNAL_SERVER_ERROR', err, { code: 'ECONNREFUSED' })

    expect(logger.error).toHaveBeenCalledWith(
      {
        causeCode: undefined,
        causeMessage: undefined,
        causeName: undefined,
        errorCode: undefined,
        errorMessage: 'database failed',
        errorName: 'Error',
        event: 'better_auth.log',
      },
      'Better Auth: INTERNAL_SERVER_ERROR',
    )
  })

  it('uses info as default development log level', () => {
    const env = {
      ...baseEnv,
      APP_ENV: 'development',
      LOG_LEVEL: 'info',
    } as const
    const logger = createLogger(env)

    expect(logger.level).toBe('info')
  })

  it('uses configured development log level', () => {
    const env = {
      ...baseEnv,
      APP_ENV: 'development',
      LOG_LEVEL: 'debug',
    } as const
    const logger = createLogger(env)

    expect(logger.level).toBe('debug')
  })

  it('adds stack to error fields only when requested', () => {
    const error = new Error('boom')

    expect(createErrorLogFields(error)).toEqual(
      expect.objectContaining({
        errorMessage: 'boom',
        errorName: 'Error',
        errorStack: undefined,
      }),
    )
    expect(createErrorLogFields(error, { includeStack: true })).toEqual(
      expect.objectContaining({
        errorMessage: 'boom',
        errorName: 'Error',
        errorStack: expect.stringContaining('Error: boom'),
      }),
    )
  })

  it('defines default redacted log fields', () => {
    expect(LOGGER_REDACT_PATHS).toEqual(
      expect.arrayContaining(['authorization', 'cookie', 'password', 'secret', 'token', 'clientSecret']),
    )
  })
})
