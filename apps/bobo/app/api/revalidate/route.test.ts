import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}))

const originalMomoBaseUrl = process.env.MOMO_BASE_URL
const originalRevalidateSecret = process.env.BOBO_REVALIDATE_SECRET

function createRequest(payload: unknown, secret = 'secret-1') {
  return new Request('http://localhost:4399/api/revalidate', {
    body: JSON.stringify(payload),
    headers: {
      'content-type': 'application/json',
      'x-bobo-revalidate-secret': secret,
    },
    method: 'POST',
  })
}

describe('post /api/revalidate', () => {
  beforeEach(() => {
    process.env.MOMO_BASE_URL = 'http://localhost:7788'
    process.env.BOBO_REVALIDATE_SECRET = 'secret-1'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env.MOMO_BASE_URL = originalMomoBaseUrl
    process.env.BOBO_REVALIDATE_SECRET = originalRevalidateSecret
  })

  it('secret 错误时返回 401', async () => {
    const { POST } = await import('./route')

    const response = await POST(createRequest({ tags: ['posts:list'] }, 'wrong-secret'))

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
    })
    expect(response.status).toBe(401)
    expect(mocks.revalidateTag).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('空 tags 和 paths 返回 400', async () => {
    const { POST } = await import('./route')

    const response = await POST(createRequest({}))

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
    })
    expect(response.status).toBe(400)
    expect(mocks.revalidateTag).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('成功 revalidate tags 和 paths', async () => {
    const { POST } = await import('./route')

    const response = await POST(
      createRequest({
        paths: ['/writing', '/writing/hello'],
        tags: ['posts:list', 'post:hello'],
      }),
    )

    await expect(response.json()).resolves.toEqual({
      ok: true,
      revalidated: {
        paths: ['/writing', '/writing/hello'],
        tags: ['posts:list', 'post:hello'],
      },
    })
    expect(response.status).toBe(200)
    expect(mocks.revalidateTag).toHaveBeenNthCalledWith(1, 'posts:list', 'max')
    expect(mocks.revalidateTag).toHaveBeenNthCalledWith(2, 'post:hello', 'max')
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, '/writing')
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, '/writing/hello')
  })
})
