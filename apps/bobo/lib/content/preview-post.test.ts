import { BizCode } from '@xdd-zone/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getPreviewPost, PREVIEW_POST_TTL_LABEL, PreviewPostError } from './preview-post'

const originalMomoBaseUrl = process.env.MOMO_BASE_URL

describe('preview-post', () => {
  afterEach(() => {
    process.env.MOMO_BASE_URL = originalMomoBaseUrl
    vi.restoreAllMocks()
  })

  it('缺少 token 时直接报错，不发请求', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await expect(getPreviewPost(undefined, 'post-1')).rejects.toBeInstanceOf(PreviewPostError)

    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('postId 和返回数据不一致时报错', async () => {
    process.env.MOMO_BASE_URL = 'http://localhost:7788'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            post: {
              coverAssetId: null,
              category: null,
              createdAt: '2026-06-17T00:00:00.000Z',
              draftRevisionId: null,
              draftSlug: 'hello',
              draftTitle: 'Hello',
              excerpt: null,
              id: 'post-2',
              publishedAt: null,
              publishedRevisionId: null,
              publishedSlug: null,
              publishedTitle: null,
              slug: 'hello',
              source: '# hello',
              status: 'draft',
              title: 'Hello',
              updatedAt: '2026-06-17T00:00:00.000Z',
              tags: [],
            },
            revision: {
              createdAt: '2026-06-17T00:00:00.000Z',
              excerpt: null,
              id: 'revision-1',
              postId: 'post-2',
              revisionNo: 1,
              source: '# hello',
              title: 'Hello',
            },
          },
          meta: {
            requestId: 'request-1',
            timestamp: '2026-06-17T00:00:00.000Z',
          },
          ok: true,
        }),
        { status: 200 },
      ),
    )

    await expect(getPreviewPost('token-1', 'post-1')).rejects.toMatchObject({
      reason: 'post-mismatch',
    })
  })

  it('通过统一请求层读取预览接口', async () => {
    process.env.MOMO_BASE_URL = 'http://localhost:7788'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: BizCode.CONTENT_PREVIEW_TOKEN_EXPIRED,
            message: '预览 token 已失效',
          },
          meta: {
            requestId: 'request-1',
            timestamp: '2026-06-17T00:00:00.000Z',
          },
          ok: false,
        }),
        { status: 401 },
      ),
    )

    await expect(getPreviewPost('token 1', 'post-1')).rejects.toMatchObject({
      message: '预览 token 已失效',
      reason: 'request-failed',
    })

    expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[0]?.toString()).toBe(
      'http://localhost:7788/rpc/content/previews/token%201',
    )
    expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[1]).toMatchObject({
      cache: 'no-store',
      method: 'GET',
    })
  })

  it('预览提示文案保持固定', () => {
    expect(PREVIEW_POST_TTL_LABEL).toBe('30 分钟')
  })
})
