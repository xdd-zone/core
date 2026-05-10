import { describe, expect, it } from 'bun:test'

import { HealthService } from './service'

function createHealthService() {
  return new HealthService({
    app: {
      name: 'XDD Zone Core',
    } as never,
    openapi: {
      version: '1.0.0',
    } as never,
  })
}

describe('HealthService', () => {
  it('数据库正常时返回 ok', async () => {
    const service = createHealthService()
    ;(service as unknown as { getDatabaseStatus: () => Promise<'up'> }).getDatabaseStatus = async () => 'up'

    const result = await service.getHealth()

    expect(result.status).toBe('ok')
    expect(result.database.status).toBe('up')
    expect(result.service).toBe('XDD Zone Core')
    expect(result.version).toBe('1.0.0')
  })

  it('数据库异常时返回 degraded', async () => {
    const service = createHealthService()
    ;(service as unknown as { getDatabaseStatus: () => Promise<'down'> }).getDatabaseStatus = async () => 'down'

    const result = await service.getHealth()

    expect(result.status).toBe('degraded')
    expect(result.database.status).toBe('down')
    expect(typeof result.timestamp).toBe('string')
    expect(result.uptime).toBeGreaterThanOrEqual(0)
  })
})
