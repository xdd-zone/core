import type { RetryEventsOutboxResponse } from '@fifa/api/events'
import type {
  ApiResponse,
  EventOutboxDetailResponse,
  EventOutboxListResponse,
  RetryEventOutboxResponse,
} from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  getOutbox: vi.fn(),
  listOutbox: vi.fn(),
  retryEvent: vi.fn(),
  retryOutbox: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      events: {
        outbox: {
          $get: rpcMocks.listOutbox,
          ':eventId': {
            $get: rpcMocks.getOutbox,
            retry: {
              $post: rpcMocks.retryEvent,
            },
          },
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

  it('读取 outbox 列表时传入分页和筛选参数', async () => {
    const responseBody: ApiResponse<EventOutboxListResponse> = {
      ok: true,
      data: { events: [], page: 2, pageSize: 20, total: 0 },
      meta: { requestId: 'request-1', timestamp: '2026-01-01T00:00:00.000Z' },
    }
    rpcMocks.listOutbox.mockResolvedValue({ json: () => Promise.resolve(responseBody) })
    const { listEventsOutbox } = await import('@fifa/api/events/events.api')

    await expect(
      listEventsOutbox({ eventType: 'content.post.published', page: 2, pageSize: 20, status: 'failed' }),
    ).resolves.toEqual(responseBody)
    expect(rpcMocks.listOutbox).toHaveBeenCalledWith({
      query: {
        eventType: 'content.post.published',
        page: '2',
        pageSize: '20',
        status: 'failed',
      },
    })
  })

  it('读取单条 outbox 时传入 eventId', async () => {
    const responseBody = {
      ok: true,
      data: { event: { id: 'event-1' } },
      meta: { requestId: 'request-1', timestamp: '2026-01-01T00:00:00.000Z' },
    } as unknown as ApiResponse<EventOutboxDetailResponse>
    rpcMocks.getOutbox.mockResolvedValue({ json: () => Promise.resolve(responseBody) })
    const { getEventOutbox } = await import('@fifa/api/events/events.api')

    await expect(getEventOutbox('event-1')).resolves.toEqual(responseBody)
    expect(rpcMocks.getOutbox).toHaveBeenCalledWith({ param: { eventId: 'event-1' } })
  })

  it('重试单条 outbox 时传入 eventId', async () => {
    const responseBody = {
      ok: true,
      data: { event: { id: 'event-1' }, warnings: [] },
      meta: { requestId: 'request-1', timestamp: '2026-01-01T00:00:00.000Z' },
    } as unknown as ApiResponse<RetryEventOutboxResponse>
    rpcMocks.retryEvent.mockResolvedValue({ json: () => Promise.resolve(responseBody) })
    const { retryEventOutbox } = await import('@fifa/api/events/events.api')

    await expect(retryEventOutbox('event-1')).resolves.toEqual(responseBody)
    expect(rpcMocks.retryEvent).toHaveBeenCalledWith({ param: { eventId: 'event-1' } })
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
