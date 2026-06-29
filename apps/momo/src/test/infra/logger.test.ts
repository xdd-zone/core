import type { MomoEnv } from '#momo/shared/env'
import { describe, expect, it, vi } from 'vitest'
import {
  createBetterAuthLogger,
  createChildLogger,
  createErrorLogFields,
  createLogger,
  LOGGER_REDACT_PATHS,
} from '#momo/infra/logger'

const baseEnv: MomoEnv = {
  APP_ENV: 'test',
  BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  BETTER_AUTH_URL: 'http://localhost:7788',
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
  LLM_PROVIDER: 'none',
  MEILI_API_KEY: undefined,
  MEILI_HOST: undefined,
  MEILI_INDEX_PREFIX: 'momo',
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
  OPENAI_API_KEY: undefined,
  OPENAI_API_FORMAT: 'chat_completions',
  OPENAI_BASE_URL: undefined,
  OPENAI_MODEL: 'gpt-5-mini',
  OPENAI_TIMEOUT_MS: 15000,
  PORT: 7788,
  SEARCH_PROVIDER: 'none',
  STORAGE_PROVIDER: 'local',
}

describe('momo 日志', () => {
  it('test 环境关闭日志输出', () => {
    const logger = createLogger(baseEnv)

    expect(logger.level).toBe('silent')
    expect(logger.isLevelEnabled('info')).toBe(false)
  })

  it('child logger 带 module 字段', () => {
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

  it('better auth 日志走 momo logger', () => {
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

  it('development 环境默认使用 info 日志级别', () => {
    const env = {
      ...baseEnv,
      APP_ENV: 'development',
      LOG_LEVEL: 'info',
    } as const
    const logger = createLogger(env)

    expect(logger.level).toBe('info')
  })

  it('development 环境使用配置的日志级别', () => {
    const env = {
      ...baseEnv,
      APP_ENV: 'development',
      LOG_LEVEL: 'debug',
    } as const
    const logger = createLogger(env)

    expect(logger.level).toBe('debug')
  })

  it('includeStack 时给错误字段添加 stack', () => {
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

  it('default 脱敏日志字段已定义', () => {
    expect(LOGGER_REDACT_PATHS).toEqual(
      expect.arrayContaining(['authorization', 'cookie', 'password', 'secret', 'token', 'clientSecret']),
    )
  })
})
