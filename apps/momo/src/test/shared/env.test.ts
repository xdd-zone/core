import { getMomoEnv } from '#momo/shared/env'
import { describe, expect, it } from 'vitest'

describe('momo env', () => {
  it('throws when required env is missing', () => {
    expect(() => getMomoEnv({ APP_ENV: 'development' })).toThrow()
  })

  it('parses comma separated CORS origins', () => {
    expect(
      getMomoEnv({
        APP_ENV: 'production',
        BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        BETTER_AUTH_URL: 'https://api.xdd.zone',
        CORS_ORIGINS: 'https://fifa.xdd.zone, https://bobo.xdd.zone',
        DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
        GITHUB_CLIENT_ID: 'github-client-id',
        GITHUB_CLIENT_SECRET: 'github-client-secret',
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
        PORT: '8080',
      }),
    ).toEqual({
      APP_ENV: 'production',
      BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      BETTER_AUTH_URL: 'https://api.xdd.zone',
      CACHE_DEFAULT_TTL_SECONDS: 300,
      CACHE_KEY_PREFIX: 'momo',
      CACHE_PROVIDER: 'memory',
      CACHE_URL: undefined,
      CORS_ORIGINS: ['https://fifa.xdd.zone', 'https://bobo.xdd.zone'],
      DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
      GITHUB_CLIENT_ID: 'github-client-id',
      GITHUB_CLIENT_SECRET: 'github-client-secret',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      COS_BUCKET: undefined,
      COS_KEY_PREFIX: 'media',
      COS_PUBLIC_BASE_URL: undefined,
      COS_REGION: undefined,
      COS_SECRET_ID: undefined,
      COS_SECRET_KEY: undefined,
      COS_SIGNED_URL_EXPIRES: 600,
      LOCAL_STORAGE_DIR: undefined,
      LOG_LEVEL: 'info',
      LOG_SQL: false,
      PORT: 8080,
      STORAGE_PROVIDER: 'local',
    })
  })

  it('uses default log config when log env is missing', () => {
    expect(
      getMomoEnv({
        APP_ENV: 'development',
        BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        BETTER_AUTH_URL: 'http://localhost:7788',
        CORS_ORIGINS: 'http://localhost:2333',
        DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
        GITHUB_CLIENT_ID: 'github-client-id',
        GITHUB_CLIENT_SECRET: 'github-client-secret',
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
        PORT: '7788',
      }),
    ).toEqual(
      expect.objectContaining({
        LOG_LEVEL: 'info',
        LOG_SQL: false,
      }),
    )
  })

  it('parses log level and sql log switch', () => {
    expect(
      getMomoEnv({
        APP_ENV: 'development',
        BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        BETTER_AUTH_URL: 'http://localhost:7788',
        CORS_ORIGINS: 'http://localhost:2333',
        DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
        GITHUB_CLIENT_ID: 'github-client-id',
        GITHUB_CLIENT_SECRET: 'github-client-secret',
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
        LOG_LEVEL: 'debug',
        LOG_SQL: 'true',
        PORT: '7788',
      }),
    ).toEqual(
      expect.objectContaining({
        LOG_LEVEL: 'debug',
        LOG_SQL: true,
      }),
    )
  })

  it('parses cache config and treats empty url as unset', () => {
    expect(
      getMomoEnv({
        APP_ENV: 'development',
        BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        BETTER_AUTH_URL: 'http://localhost:7788',
        CACHE_DEFAULT_TTL_SECONDS: '60',
        CACHE_KEY_PREFIX: 'momo-test',
        CACHE_PROVIDER: 'memory',
        CACHE_URL: '',
        CORS_ORIGINS: 'http://localhost:2333',
        DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
        GITHUB_CLIENT_ID: 'github-client-id',
        GITHUB_CLIENT_SECRET: 'github-client-secret',
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
        PORT: '7788',
      }),
    ).toEqual(
      expect.objectContaining({
        CACHE_DEFAULT_TTL_SECONDS: 60,
        CACHE_KEY_PREFIX: 'momo-test',
        CACHE_PROVIDER: 'memory',
        CACHE_URL: undefined,
      }),
    )
  })

  it('throws when redis cache has no url', () => {
    expect(() =>
      getMomoEnv({
        APP_ENV: 'development',
        BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        BETTER_AUTH_URL: 'http://localhost:7788',
        CACHE_PROVIDER: 'redis',
        CORS_ORIGINS: 'http://localhost:2333',
        DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
        GITHUB_CLIENT_ID: 'github-client-id',
        GITHUB_CLIENT_SECRET: 'github-client-secret',
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
        PORT: '7788',
      }),
    ).toThrow()
  })

  it('parses storage config and treats empty optional values as unset', () => {
    expect(
      getMomoEnv({
        APP_ENV: 'development',
        BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        BETTER_AUTH_URL: 'http://localhost:7788',
        CORS_ORIGINS: 'http://localhost:2333',
        COS_PUBLIC_BASE_URL: '',
        COS_SECRET_ID: '',
        DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
        GITHUB_CLIENT_ID: 'github-client-id',
        GITHUB_CLIENT_SECRET: 'github-client-secret',
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
        LOCAL_STORAGE_DIR: '',
        PORT: '7788',
        STORAGE_PROVIDER: 'cos',
      }),
    ).toEqual(
      expect.objectContaining({
        COS_KEY_PREFIX: 'media',
        COS_PUBLIC_BASE_URL: undefined,
        COS_SECRET_ID: undefined,
        COS_SIGNED_URL_EXPIRES: 600,
        LOCAL_STORAGE_DIR: undefined,
        STORAGE_PROVIDER: 'cos',
      }),
    )
  })
})
