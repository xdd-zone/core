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
        CORS_ORIGINS: 'https://fifa.xdd.zone, https://bobo.xdd.zone',
        DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
        PORT: '8080',
      }),
    ).toEqual({
      APP_ENV: 'production',
      CORS_ORIGINS: ['https://fifa.xdd.zone', 'https://bobo.xdd.zone'],
      DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
      PORT: 8080,
    })
  })
})
