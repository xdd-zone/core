import type { ApiResponse, SystemLogListResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  logs: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      system: {
        logs: {
          $get: rpcMocks.logs,
        },
      },
    },
  },
}))

describe('system logs api 封装', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取 /rpc/system/logs 并转换数字参数', async () => {
    const responseBody: ApiResponse<SystemLogListResponse> = {
      data: {
        from: '2026-01-01T00:00:00.000Z',
        logs: [],
        nextCursor: null,
        queriedAt: '2026-01-01T01:00:00.000Z',
        to: '2026-01-01T01:00:00.000Z',
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T01:00:00.000Z',
      },
      ok: true,
    }
    rpcMocks.logs.mockResolvedValue({ json: () => Promise.resolve(responseBody) })
    const { getSystemLogs } = await import('@fifa/api/system/logs.api')

    await expect(
      getSystemLogs({
        limit: 100,
        minDurationMs: 1000,
        minLevel: 'warn',
        rangeMinutes: 60,
        statusFrom: 500,
        statusTo: 599,
      }),
    ).resolves.toEqual(responseBody)
    expect(rpcMocks.logs).toHaveBeenCalledWith({
      query: {
        cursor: undefined,
        event: undefined,
        from: undefined,
        limit: '100',
        minDurationMs: '1000',
        minLevel: 'warn',
        module: undefined,
        path: undefined,
        rangeMinutes: '60',
        requestId: undefined,
        statusFrom: '500',
        statusTo: '599',
        to: undefined,
      },
    })
  })
})
