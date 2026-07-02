import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/lib/http', () => ({
  http: {
    get: mocks.get,
  },
}))

describe('post api', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('公开文章列表请求带 posts:list tag', async () => {
    const { getPublicPosts } = await import('./post.api')

    await getPublicPosts({
      categorySlug: 'notes',
      pageSize: 20,
      tagSlug: 'nextjs',
    })

    expect(mocks.get).toHaveBeenCalledWith('/rpc/bobo/content/posts', {
      init: {
        next: {
          revalidate: 60,
          tags: ['posts:list'],
        },
      },
      query: {
        categorySlug: 'notes',
        pageSize: 20,
        tagSlug: 'nextjs',
      },
    })
  })

  it('公开文章详情请求带 post slug tag', async () => {
    const { getPublicPost } = await import('./post.api')

    await getPublicPost('hello world')

    expect(mocks.get).toHaveBeenCalledWith('/rpc/bobo/content/posts/hello%20world', {
      init: {
        next: {
          revalidate: 60,
          tags: ['post:hello world'],
        },
      },
    })
  })

  it('预览文章请求保持 no-store', async () => {
    const { getPreviewPost } = await import('./post.api')

    await getPreviewPost('token-1')

    expect(mocks.get).toHaveBeenCalledWith('/rpc/content/previews/token-1', {
      init: {
        cache: 'no-store',
      },
    })
  })
})
