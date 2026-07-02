import type { RetryEventsOutboxResponse } from '@fifa/api/events'
import type { ApiResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  retryOutbox: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      events: {
        outbox: {
          retry: {
            $post: rpcMocks.retryOutbox,
          },
        },
      },
    },
  },
}))

describe('events api 封装', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('重试 outbox 时调用 /rpc/events/outbox/retry', async () => {
    const responseBody: ApiResponse<RetryEventsOutboxResponse> = {
      ok: true,
      data: {
        handled: 1,
        warnings: [],
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.retryOutbox.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { retryEventsOutbox } = await import('@fifa/api/events/events.api')

    await expect(retryEventsOutbox()).resolves.toEqual(responseBody)
  })
})
