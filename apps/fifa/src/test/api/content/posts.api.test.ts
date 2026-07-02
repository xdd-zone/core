import type { PublishContentPostResponse } from '@fifa/api/content/posts.api'
import type { ApiResponse, PostDetailResponse, PostListResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  createPost: vi.fn(),
  listPosts: vi.fn(),
  publishPost: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
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
          category: null,
          coverAssetId: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          draftRevisionId: 'revision-1',
          draftSlug: 'hello-world',
          draftTitle: 'Hello World',
          excerpt: null,
          id: 'post-1',
          publishedAt: null,
          publishedRevisionId: null,
          publishedSlug: null,
          publishedTitle: null,
          slug: 'hello-world',
          source: '# Hello World\n',
          status: 'draft',
          tags: [],
          title: 'Hello World',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    const payload = {
      slug: 'hello-world',
      source: '# Hello World\n',
      title: 'Hello World',
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
          category: null,
          coverAssetId: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          draftRevisionId: 'revision-1',
          draftSlug: 'hello-world',
          draftTitle: 'Hello World',
          excerpt: null,
          id: 'post-1',
          publishedAt: '2026-01-01T00:00:00.000Z',
          publishedRevisionId: 'revision-1',
          publishedSlug: 'hello-world',
          publishedTitle: 'Hello World',
          slug: 'hello-world',
          source: '# Hello World\n',
          status: 'published',
          tags: [],
          title: 'Hello World',
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
})
