import type { PublishContentPostResponse } from '@fifa/api/content/posts.api'
import type { ApiResponse, PostDetailResponse, PostListResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  createPost: vi.fn(),
  listPosts: vi.fn(),
  publishPost: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoBaseUrl: 'http://localhost:7788',
  momoClient: {
    rpc: {
      content: {
        posts: {
          ':id': {
            publish: {
              $post: rpcMocks.publishPost,
            },
          },
          $get: rpcMocks.listPosts,
          $post: rpcMocks.createPost,
        },
      },
    },
  },
}))

describe('content api 封装', () => {
  afterEach(() => {
    rpcMocks.createPost.mockReset()
    rpcMocks.listPosts.mockReset()
    rpcMocks.publishPost.mockReset()
    vi.unstubAllGlobals()
  })

  it('读取文章列表时返回 Momo 统一响应', async () => {
    const responseBody: ApiResponse<PostListResponse> = {
      ok: true,
      data: {
        posts: [],
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.listPosts.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { listContentPosts } = await import('@fifa/api/content/posts.api')

    await expect(listContentPosts()).resolves.toEqual(responseBody)
  })

  it('创建文章时把请求体传给 Momo', async () => {
    const responseBody: ApiResponse<PostDetailResponse> = {
      ok: true,
      data: {
        post: {
          createdAt: '2026-01-01T00:00:00.000Z',
          draft: {
            category: null,
            coverAssetId: null,
            excerpt: null,
            slug: 'hello-world',
            tags: [],
            title: 'Hello World',
          },
          draftRevisionId: 'revision-1',
          id: 'post-1',
          published: {
            category: null,
            coverAssetId: null,
            excerpt: null,
            publishedAt: null,
            slug: null,
            tags: [],
            title: null,
          },
          publishedRevisionId: null,
          source: '# Hello World\n',
          status: 'draft',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    const payload = {
      draft: {
        slug: 'hello-world',
        source: '# Hello World\n',
        title: 'Hello World',
      },
    }
    rpcMocks.createPost.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { createContentPost } = await import('@fifa/api/content/posts.api')

    await expect(createContentPost(payload)).resolves.toEqual(responseBody)
    expect(rpcMocks.createPost).toHaveBeenCalledWith({
      json: payload,
    })
  })

  it('发布文章时保留成功响应里的 warnings', async () => {
    const responseBody: ApiResponse<PublishContentPostResponse> = {
      ok: true,
      data: {
        post: {
          createdAt: '2026-01-01T00:00:00.000Z',
          draft: {
            category: null,
            coverAssetId: null,
            excerpt: null,
            slug: 'hello-world',
            tags: [],
            title: 'Hello World',
          },
          draftRevisionId: 'revision-1',
          id: 'post-1',
          published: {
            category: null,
            coverAssetId: null,
            excerpt: null,
            publishedAt: '2026-01-01T00:00:00.000Z',
            slug: 'hello-world',
            tags: [],
            title: 'Hello World',
          },
          publishedRevisionId: 'revision-1',
          source: '# Hello World\n',
          status: 'published',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        warnings: [
          {
            code: 'revalidate_failed',
            message: '站点缓存刷新失败',
          },
        ],
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.publishPost.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { publishContentPost } = await import('@fifa/api/content/posts.api')

    await expect(publishContentPost('post-1')).resolves.toEqual(responseBody)
    expect(rpcMocks.publishPost).toHaveBeenCalledWith({
      param: {
        id: 'post-1',
      },
    })
  })

  it('归档文章时保留成功响应里的 warnings', async () => {
    const responseBody: ApiResponse<PostDetailResponse> = {
      ok: true,
      data: {
        post: {
          createdAt: '2026-01-01T00:00:00.000Z',
          draft: {
            category: null,
            coverAssetId: null,
            excerpt: null,
            slug: 'hello-world',
            tags: [],
            title: 'Hello World',
          },
          draftRevisionId: 'revision-1',
          id: 'post-1',
          published: {
            category: null,
            coverAssetId: null,
            excerpt: null,
            publishedAt: '2026-01-01T00:00:00.000Z',
            slug: 'hello-world',
            tags: [],
            title: 'Hello World',
          },
          publishedRevisionId: 'revision-1',
          source: '# Hello World\n',
          status: 'archived',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        warnings: [
          {
            code: 'content.post.archive.side_effect_failed',
            message: '文章已归档，但 Bobo 缓存刷新或搜索索引删除失败。稍后可以重试刷新。',
          },
        ],
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response(JSON.stringify(responseBody))
    })
    vi.stubGlobal('fetch', fetchMock)
    const { archiveContentPost } = await import('@fifa/api/content/posts.api')

    await expect(archiveContentPost('post-1')).resolves.toEqual(responseBody)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/rpc/content/posts/post-1/archive')
    expect(fetchMock.mock.calls[0]?.[1]).toEqual({
      credentials: 'include',
      method: 'POST',
    })
  })
})
