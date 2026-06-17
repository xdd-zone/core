import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import PreviewPostPage from './page'

describe('preview post page', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('token 缺失时显示错误页', async () => {
    const page = await PreviewPostPage({
      params: Promise.resolve({ postId: 'post-1' }),
      searchParams: Promise.resolve({}),
    })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('文章预览不可用')
    expect(html).toContain('预览链接缺少 token。')
  })

  it('momo 返回成功时渲染标题、摘要和正文', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            post: createPost({ source: '# Draft Body' }),
            revision: createRevision({
              excerpt: '草稿摘要',
              source: '# Draft Body',
              title: '草稿标题',
            }),
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

    const page = await PreviewPostPage({
      params: Promise.resolve({ postId: 'post-1' }),
      searchParams: Promise.resolve({ token: 'token-1' }),
    })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('当前是文章预览')
    expect(html).toContain('草稿标题')
    expect(html).toContain('草稿摘要')
    expect(html).toContain('Draft Body')
  })

  it('token 过期时显示错误页', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 'CONTENT_PREVIEW_TOKEN_EXPIRED',
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

    const page = await PreviewPostPage({
      params: Promise.resolve({ postId: 'post-1' }),
      searchParams: Promise.resolve({ token: 'token-1' }),
    })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('文章预览不可用')
    expect(html).toContain('预览链接已失效，或文章不存在。')
  })
})

function createPost(overrides: Partial<ReturnType<typeof createBasePost>> = {}) {
  return {
    ...createBasePost(),
    ...overrides,
  }
}

function createBasePost() {
  return {
    coverAssetId: null,
    createdAt: '2026-06-17T00:00:00.000Z',
    draftRevisionId: 'revision-1',
    excerpt: '草稿摘要',
    format: 'markdown',
    id: 'post-1',
    publishedAt: null,
    publishedRevisionId: null,
    slug: 'hello',
    source: '# Draft Body',
    status: 'draft',
    title: '草稿标题',
    updatedAt: '2026-06-17T00:00:00.000Z',
  } as const
}

function createRevision(overrides: Partial<ReturnType<typeof createBaseRevision>> = {}) {
  return {
    ...createBaseRevision(),
    ...overrides,
  }
}

function createBaseRevision() {
  return {
    createdAt: '2026-06-17T00:00:00.000Z',
    excerpt: '草稿摘要',
    format: 'markdown',
    id: 'revision-1',
    postId: 'post-1',
    revisionNo: 1,
    source: '# Draft Body',
    title: '草稿标题',
  } as const
}
