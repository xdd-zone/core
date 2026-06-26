import { describe, expect, it, vi } from 'vitest'

import { getPreviewPost, PREVIEW_POST_TTL_LABEL, PreviewPostError } from './preview-post'

describe('preview-post', () => {
  it('缺少 token 时直接报错，不发请求', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await expect(getPreviewPost(undefined, 'post-1')).rejects.toBeInstanceOf(PreviewPostError)

    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('postId 和返回数据不一致时报错', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            post: {
              coverAssetId: null,
              category: null,
              createdAt: '2026-06-17T00:00:00.000Z',
              draftRevisionId: null,
              excerpt: null,
              id: 'post-2',
              publishedAt: null,
              publishedRevisionId: null,
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

  it('预览提示文案保持固定', () => {
    expect(PREVIEW_POST_TTL_LABEL).toBe('30 分钟')
  })
})
