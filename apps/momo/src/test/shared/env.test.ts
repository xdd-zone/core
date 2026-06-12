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
      CORS_ORIGINS: ['https://fifa.xdd.zone', 'https://bobo.xdd.zone'],
      DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
      GITHUB_CLIENT_ID: 'github-client-id',
      GITHUB_CLIENT_SECRET: 'github-client-secret',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      PORT: 8080,
    })
  })
})
