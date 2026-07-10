import type { ApiResponse, SystemReadinessResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  readiness: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      system: {
        readiness: {
          $get: rpcMocks.readiness,
        },
      },
    },
  },
}))

describe('system readiness api 封装', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取 /rpc/system/readiness', async () => {
    const responseBody: ApiResponse<SystemReadinessResponse> = {
      ok: true,
      data: {
        checkedAt: '2026-01-01T00:00:00.000Z',
        checks: [],
        status: 'ready',
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.readiness.mockResolvedValue({ json: () => Promise.resolve(responseBody) })
    const { getSystemReadiness } = await import('@fifa/api/system/readiness.api')

    await expect(getSystemReadiness()).resolves.toEqual(responseBody)
    expect(rpcMocks.readiness).toHaveBeenCalledTimes(1)
  })
})
