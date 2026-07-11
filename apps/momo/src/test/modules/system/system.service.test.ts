import type { MomoRuntime } from '#momo/bootstrap'
import type { DbClient } from '#momo/infra/db/client'
import { describe, expect, it, vi } from 'vitest'
import { getReadinessStatus, getSystemLogs } from '#momo/modules/system/system.service'

describe('system readiness', () => {
  it('依赖可用时返回 ready，未启用搜索返回 disabled', async () => {
    const runtime = createRuntime()
    const result = await getReadinessStatus(runtime, createDb())

    expect(result.status).toBe('ready')
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'database', provider: 'postgres', status: 'ready' }),
        expect.objectContaining({ name: 'cache', provider: 'memory', status: 'ready' }),
        expect.objectContaining({ name: 'search', provider: 'none', status: 'disabled' }),
        expect.objectContaining({ name: 'storage', provider: 'local', status: 'ready' }),
        expect.objectContaining({ name: 'logging', provider: 'none', status: 'disabled' }),
      ]),
    )
    expect(runtime.cache.delete).toHaveBeenCalledTimes(1)
  })

  it('单项失败时返回 degraded 和固定错误说明', async () => {
    const runtime = createRuntime()
    vi.mocked(runtime.storage.health).mockRejectedValue(new Error('secret storage error'))

    const result = await getReadinessStatus(runtime, createDb())
    const storage = result.checks.find((check) => check.name === 'storage')

    expect(result.status).toBe('degraded')
    expect(storage).toMatchObject({
      message: '文件存储不可用',
      provider: 'local',
      status: 'error',
    })
    expect(JSON.stringify(result)).not.toContain('secret storage error')
  })

  it('日志查询默认使用最近一小时', async () => {
    const runtime = createRuntime()
    vi.mocked(runtime.logs.query).mockResolvedValue({
      from: '2026-01-01T00:00:00.000Z',
      logs: [],
      nextCursor: null,
      to: '2026-01-01T01:00:00.000Z',
    })

    const result = await getSystemLogs(runtime, {
      limit: 100,
      minLevel: 'warn',
      rangeMinutes: 60,
    })

    expect(result.logs).toEqual([])
    expect(runtime.logs.query).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(String),
        limit: 100,
        minLevel: 'warn',
        to: expect.any(String),
      }),
    )
    const input = vi.mocked(runtime.logs.query).mock.calls[0]?.[0]
    expect(new Date(input!.to).getTime() - new Date(input!.from).getTime()).toBe(60 * 60 * 1000)
  })
})

function createDb(): DbClient {
  return {
    execute: vi.fn(async () => []),
  } as unknown as DbClient
}

function createRuntime(): MomoRuntime {
  return {
    cache: {
      delete: vi.fn(async () => undefined),
      get: vi.fn(async () => 'ok'),
      set: vi.fn(async () => undefined),
    },
    env: {
      CACHE_PROVIDER: 'memory',
      LOG_READER_PROVIDER: 'none',
      SEARCH_PROVIDER: 'none',
      STORAGE_PROVIDER: 'local',
    },
    logs: {
      enabled: false,
      health: vi.fn(async () => ({ status: 'disabled' })),
      provider: 'none',
      query: vi.fn(),
    },
    search: {
      health: vi.fn(async () => ({ status: 'disabled' })),
    },
    storage: {
      health: vi.fn(async () => ({ status: 'available' })),
    },
  } as unknown as MomoRuntime
}
