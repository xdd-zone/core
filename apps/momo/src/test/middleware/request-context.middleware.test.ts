import type { HonoEnv } from '#momo/shared/hono-env'
import { REQUEST_ID_HEADER, requestContextMiddleware } from '#momo/middleware'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

function createApp() {
  const app = new Hono<HonoEnv>()

  app.use('*', requestContextMiddleware)
  app.get('/demo', (c) => c.text(c.var.requestId))

  return app
}

describe('request context middleware', () => {
  it('generates request id when header is missing', async () => {
    const app = createApp()
    const response = await app.request('/demo')
    const requestId = response.headers.get(REQUEST_ID_HEADER)

    expect(requestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(await response.text()).toBe(requestId)
  })

  it('uses valid x-request-id header', async () => {
    const app = createApp()
    const response = await app.request('/demo', {
      headers: {
        [REQUEST_ID_HEADER]: 'fifa.request-1:abc_123',
      },
    })

    expect(response.headers.get(REQUEST_ID_HEADER)).toBe('fifa.request-1:abc_123')
    expect(await response.text()).toBe('fifa.request-1:abc_123')
  })

  it('ignores invalid x-request-id header', async () => {
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
