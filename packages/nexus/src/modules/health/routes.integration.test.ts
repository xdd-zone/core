import { createTestApp, createTestRequest, readJson } from '@nexus/test'
import { describe, expect, it } from 'bun:test'

describe('health routes', () => {
  it('GET /api/health/ 应返回服务状态', async () => {
    const { app, context } = createTestApp()
    const response = await app.handle(createTestRequest('/api/health/'))
    const body = await readJson<{
      service: string
      version: string
      timestamp: string
      database: {
        status: 'up' | 'down'
      }
    }>(response)

    expect(response.status).toBe(200)
    expect(body.service).toBe(context.config.app.name)
    expect(body.version).toBe(context.config.openapi.version)
    expect(Number.isNaN(new Date(body.timestamp).getTime())).toBe(false)
    expect(body.database.status).toBe('up')
  })
})
