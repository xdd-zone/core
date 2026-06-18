import type { ApiResponse, PostDetailResponse, PostListResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  createPost: vi.fn(),
  listPosts: vi.fn(),
  uploadImage: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      content: {
        assets: {
          images: {
            $post: rpcMocks.uploadImage,
          },
        },
        posts: {
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
    rpcMocks.uploadImage.mockReset()
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
          coverAssetId: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          draftRevisionId: 'revision-1',
          excerpt: null,
          id: 'post-1',
          publishedAt: null,
          publishedRevisionId: null,
          slug: 'hello-world',
          source: '# Hello World\n',
          status: 'draft',
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

  it('上传图片时使用 file 字段', async () => {
    const file = new File(['image'], 'cover.png', { type: 'image/png' })
    rpcMocks.uploadImage.mockResolvedValue({
      json: () =>
        Promise.resolve({
          ok: true,
          data: {
            asset: {
              alt: null,
              fileName: 'cover.png',
              id: 'asset-1',
              mimeType: 'image/png',
              size: 5,
              storagePath: 'content/images/cover.png',
              url: null,
            },
          },
          meta: {
            requestId: 'request-1',
            timestamp: '2026-01-01T00:00:00.000Z',
          },
        }),
    })
    const { uploadContentImage } = await import('@fifa/api/content/posts.api')

    await uploadContentImage(file)
    expect(rpcMocks.uploadImage).toHaveBeenCalledWith({
      form: {
        file,
      },
    })
  })
})
