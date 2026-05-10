import { createIntegrationTestContext } from '@nexus/test'
import { describe, expect, it } from 'bun:test'

const integration = createIntegrationTestContext()

describe('health routes', () => {
  it('GET /api/health/ 应返回服务状态', async () => {
    const { response, body } = await integration.json<{
      service: string
      version: string
      timestamp: string
      database: {
        status: 'up' | 'down'
      }
    }>('/api/health/')

    expect(response.status).toBe(200)
    expect(body.service).toBe(integration.context.config.app.name)
    expect(body.version).toBe(integration.context.config.openapi.version)
    expect(Number.isNaN(new Date(body.timestamp).getTime())).toBe(false)
    expect(body.database.status).toBe('up')
  })
})
