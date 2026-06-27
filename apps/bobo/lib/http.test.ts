import { BizCode } from '@xdd-zone/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { http } from './http'

const originalMomoBaseUrl = process.env.MOMO_BASE_URL

describe('http', () => {
  afterEach(() => {
    process.env.MOMO_BASE_URL = originalMomoBaseUrl
    vi.restoreAllMocks()
  })

  it('2xx 成功响应原样返回', async () => {
    process.env.MOMO_BASE_URL = 'http://localhost:7788'
    const payload = {
      data: {
        message: 'ok',
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-06-17T00:00:00.000Z',
      },
      ok: true,
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }))

    await expect(http.get<{ message: string }>('/rpc/health')).resolves.toEqual(payload)
  })

  it('非 2xx 的 ApiResponse 错误原样返回', async () => {
    process.env.MOMO_BASE_URL = 'http://localhost:7788'
    const payload = {
      error: {
        code: BizCode.COMMON_NOT_FOUND,
        message: '文章不存在',
      },
      meta: {
        requestId: 'request-404',
        timestamp: '2026-06-17T00:00:00.000Z',
      },
      ok: false,
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(payload), { status: 404 }))

    await expect(http.get('/rpc/bobo/content/posts/missing')).resolves.toEqual(payload)
  })

  it('非 JSON 响应返回 Momo 暂时不可用', async () => {
    process.env.MOMO_BASE_URL = 'http://localhost:7788'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('not json', { status: 502 }))

    const result = await http.get('/rpc/bobo/content/posts')

    expect(result).toMatchObject({
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: 'Momo 接口暂时不可用。',
      },
      ok: false,
    })
  })

  it('fetch 抛错时返回 Momo 暂时不可用', async () => {
    process.env.MOMO_BASE_URL = 'http://localhost:7788'

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connect failed'))

    const result = await http.get('/rpc/bobo/content/posts')

    expect(result).toMatchObject({
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: 'Momo 接口暂时不可用。',
      },
      ok: false,
    })
  })

  it('get 请求会拼接 query', async () => {
    process.env.MOMO_BASE_URL = 'http://localhost:7788'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {},
          meta: {
            requestId: 'request-1',
            timestamp: '2026-06-17T00:00:00.000Z',
          },
          ok: true,
        }),
      ),
    )

    await http.get('/rpc/bobo/content/posts', {
      query: {
        categorySlug: 'notes',
        pageSize: 50,
        tagSlug: undefined,
      },
    })

    expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[0]?.toString()).toBe(
      'http://localhost:7788/rpc/bobo/content/posts?categorySlug=notes&pageSize=50',
    )
  })

  it('post 请求默认带 JSON content-type', async () => {
    process.env.MOMO_BASE_URL = 'http://localhost:7788'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {},
          meta: {
            requestId: 'request-1',
            timestamp: '2026-06-17T00:00:00.000Z',
          },
          ok: true,
        }),
      ),
    )

    await http.post('/rpc/content/posts', { title: 'Hello' })

    const init = vi.mocked(globalThis.fetch).mock.calls[0]?.[1]

    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ title: 'Hello' }))
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json')
  })
})
