import { getMomoEnv } from '#momo/shared/env'
import { describe, expect, it } from 'vitest'

describe('momo 环境变量', () => {
  it('required 环境变量缺少时抛错', () => {
    expect(() => getMomoEnv({ APP_ENV: 'development' })).toThrow()
  })

  it('comma 分隔的 CORS 来源会被解析', () => {
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

  it('默认日志配置在缺少日志环境变量时生效', () => {
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

  it('日志级别和 SQL 日志开关会被解析', () => {
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

  it('缓存配置会把空 URL 当作未设置', () => {
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

  it('redis 缓存缺少 URL 时抛错', () => {
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

  it('存储配置会把空可选值当作未设置', () => {
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
