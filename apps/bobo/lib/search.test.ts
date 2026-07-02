import { BizCode } from '@xdd-zone/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  searchPublicSite: vi.fn(),
}))

vi.mock('@/lib/api/search.api', () => ({
  searchPublicSite: mocks.searchPublicSite,
}))

describe('search domain', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取搜索结果成功时返回 query 和 results', async () => {
    const { searchPublicSite } = await import('./search')

    mocks.searchPublicSite.mockResolvedValue({
      data: {
        results: [
          {
            id: 'post-1',
            publishedAt: '2026-06-01T00:00:00.000Z',
            summary: '一篇文章。',
            title: '文章一',
            type: 'post',
            url: '/writing/post-1',
          },
        ],
      },
      meta: { requestId: 'request-1', timestamp: '2026-06-01T00:00:00.000Z' },
      ok: true,
    })

    await expect(searchPublicSite('  bobo  ')).resolves.toMatchObject({
      query: 'bobo',
      results: [{ id: 'post-1', type: 'post' }],
    })
    expect(mocks.searchPublicSite).toHaveBeenCalledWith('bobo')
  })

  it('momo 搜索返回错误时抛出错误信息', async () => {
    const { searchPublicSite } = await import('./search')

    mocks.searchPublicSite.mockResolvedValue({
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: 'search failed',
      },
      meta: { requestId: 'request-2', timestamp: '2026-06-01T00:00:00.000Z' },
      ok: false,
    })

    await expect(searchPublicSite('bobo')).rejects.toMatchObject({
      code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
      message: 'search failed',
      reason: 'request-failed',
    })
  })
})
