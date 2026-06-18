import type { HonoEnv } from '#momo/shared/hono-env'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { REQUEST_ID_HEADER, requestContextMiddleware } from '#momo/middleware'

function createApp() {
  const app = new Hono<HonoEnv>()

  app.use('*', requestContextMiddleware)
  app.get('/demo', (c) => c.text(c.var.requestId))

  return app
}

describe('request context 中间件', () => {
  it('missing 请求头时生成 request id', async () => {
    const app = createApp()
    const response = await app.request('/demo')
    const requestId = response.headers.get(REQUEST_ID_HEADER)

    expect(requestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(await response.text()).toBe(requestId)
  })

  it('valid x-request-id 请求头', async () => {
    const app = createApp()
    const response = await app.request('/demo', {
      headers: {
        [REQUEST_ID_HEADER]: 'fifa.request-1:abc_123',
      },
    })

    expect(response.headers.get(REQUEST_ID_HEADER)).toBe('fifa.request-1:abc_123')
    expect(await response.text()).toBe('fifa.request-1:abc_123')
  })

  it('invalid x-request-id 请求头被忽略', async () => {
    const app = createApp()
    const response = await app.request('/demo', {
      headers: {
        [REQUEST_ID_HEADER]: 'bad request id',
      },
    })
    const requestId = response.headers.get(REQUEST_ID_HEADER)

    expect(requestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(requestId).not.toBe('bad request id')
  })
})
