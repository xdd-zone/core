import { describe, expect, it } from 'bun:test'
import { createApp } from '@/app'

describe('openapi smoke', () => {
  it('should export openapi json with key api paths', async () => {
    const app = createApp()
    const response = await app.handle(new Request('http://localhost/openapi/json'))

    expect(response.status).toBe(200)

    const document = await response.json() as {
      paths?: Record<string, unknown>
    }

    expect(document.paths).toBeTruthy()
    expect(document.paths?.['/api/health/']).toBeTruthy()
    expect(document.paths?.['/api/auth/me']).toBeTruthy()
    expect(document.paths?.['/api/user/']).toBeTruthy()
  })
})
