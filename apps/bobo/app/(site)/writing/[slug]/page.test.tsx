import { BizCode } from '@xdd-zone/contracts'
import { notFound } from 'next/navigation'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  class PublicContentError extends Error {
    readonly reason: 'request-failed' | 'invalid-response'
    readonly code?: string

    constructor(reason: 'request-failed' | 'invalid-response', message: string, code?: string) {
      super(message)
      this.name = 'PublicContentError'
      this.reason = reason
      this.code = code
    }
  }

  return {
    getPublicPost: vi.fn(),
    notFound: vi.fn(() => {
      throw new Error('NEXT_NOT_FOUND')
    }),
    PublicContentError,
  }
})

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
}))

vi.mock('@/lib/content/public-content', () => ({
  getPublicPost: mocks.getPublicPost,
  PublicContentError: mocks.PublicContentError,
}))

describe('writing detail page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('文章不存在时显示 404', async () => {
    const { default: WritingDetailPage } = await import('./page')

    mocks.getPublicPost.mockRejectedValue(
      new mocks.PublicContentError('request-failed', '文章不存在', BizCode.COMMON_NOT_FOUND),
    )

    await expect(
      WritingDetailPage({
        params: Promise.resolve({ slug: 'missing' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalledOnce()
  })

  it('momo 不可用时显示请求错误', async () => {
    const { default: WritingDetailPage } = await import('./page')

    mocks.getPublicPost.mockRejectedValue(
      new mocks.PublicContentError('request-failed', 'Momo 接口暂时不可用。', BizCode.SYSTEM_UPSTREAM_TIMEOUT),
    )

    const page = await WritingDetailPage({
      params: Promise.resolve({ slug: 'hello' }),
    })
    const html = renderToStaticMarkup(page)

    expect(notFound).not.toHaveBeenCalled()
    expect(html).toContain('文稿暂时打不开')
    expect(html).toContain('Momo 接口暂时不可用。')
  })

  it('文章数据格式不正确时显示格式错误', async () => {
    const { default: WritingDetailPage } = await import('./page')

    mocks.getPublicPost.mockRejectedValue(
      new mocks.PublicContentError('invalid-response', 'Momo 返回的公开文章详情格式不正确。'),
    )

    const page = await WritingDetailPage({
      params: Promise.resolve({ slug: 'hello' }),
    })
    const html = renderToStaticMarkup(page)

    expect(notFound).not.toHaveBeenCalled()
    expect(html).toContain('文稿暂时打不开')
    expect(html).toContain('文章数据格式不正确。')
  })
})
