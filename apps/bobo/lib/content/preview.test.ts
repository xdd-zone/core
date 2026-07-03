import { afterEach, describe, expect, it, vi } from 'vitest'

import { getGenericPreview, PreviewError } from './preview'

const originalMomoBaseUrl = process.env.MOMO_BASE_URL

describe('generic preview', () => {
  afterEach(() => {
    process.env.MOMO_BASE_URL = originalMomoBaseUrl
    vi.restoreAllMocks()
  })

  it('读取项目预览', async () => {
    process.env.MOMO_BASE_URL = 'http://localhost:7788'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            project: {
              draft: {
                coverAssetId: null,
                description: '项目说明',
                links: [],
                order: 0,
                slug: 'project-draft',
                title: '项目草稿',
              },
              id: 'project-1',
              published: {
                coverAssetId: null,
                description: null,
                links: [],
                publishedAt: null,
                slug: null,
                title: null,
              },
              status: 'draft',
              updatedAt: '2026-07-02T08:00:00.000Z',
            },
            targetId: 'project-1',
            targetType: 'project',
          },
          meta: {
            requestId: 'request-1',
            timestamp: '2026-07-02T08:00:00.000Z',
          },
          ok: true,
        }),
      ),
    )

    await expect(getGenericPreview('token-1')).resolves.toMatchObject({
      project: {
        draft: {
          title: '项目草稿',
        },
        id: 'project-1',
      },
      targetId: 'project-1',
      targetType: 'project',
    })

    expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[0]?.toString()).toBe(
      'http://localhost:7788/rpc/previews/token-1',
    )
  })

  it('缺少 token 时直接报错', async () => {
    await expect(getGenericPreview(undefined)).rejects.toBeInstanceOf(PreviewError)
  })
})
