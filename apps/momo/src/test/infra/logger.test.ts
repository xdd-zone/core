import type { MomoEnv } from '#momo/shared/env'
import { createBetterAuthLogger, createChildLogger, createLogger } from '#momo/infra/logger'
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
  PORT: 7788,
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
})
