import type { ApiResponse, SiteConfigResponse } from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSiteRoute } from '#momo/modules/site/site.route'

const mocks = vi.hoisted(() => ({
  getSiteConfig: vi.fn(),
  revalidate: vi.fn(),
  updateSiteConfig: vi.fn(),
}))

vi.mock('#momo/infra/db/client', () => ({
  getDb: vi.fn(() => ({})),
}))

vi.mock('#momo/modules/auth/index', () => ({
  createRequirePermission: vi.fn(() => async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'user-id' })
    await next()
  }),
}))

vi.mock('#momo/modules/site/site.repository', () => ({
  createSiteRepository: vi.fn(() => ({
    getSiteConfig: mocks.getSiteConfig,
    updateSiteConfig: mocks.updateSiteConfig,
  })),
}))

describe('site 路由', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.revalidate.mockResolvedValue(undefined)
    mocks.updateSiteConfig.mockResolvedValue(createSiteConfigRecord())
  })

  it('保存站点配置后触发 Bobo 刷新', async () => {
    const runtime = createRuntime()
    const app = createSiteRoute(runtime)

    const response = await app.request('/rpc/site/config', {
      body: JSON.stringify({
        seo: {
          description: '站点描述',
          title: 'XDD',
        },
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })
    const body = (await response.json()) as ApiResponse<SiteConfigResponse>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mocks.updateSiteConfig).toHaveBeenCalledWith('bobo', {
      seo: {
        description: '站点描述',
        title: 'XDD',
      },
    })
    expect(runtime.boboRevalidate.revalidate).toHaveBeenCalledWith({
      paths: ['/', '/writing', '/projects', '/sitemap.xml', '/rss.xml'],
      tags: ['site:config', 'site:home', 'site:nav', 'posts:list', 'projects:list'],
    })
  })
})

function createRuntime(): MomoRuntime {
  return {
    boboRevalidate: {
      revalidate: mocks.revalidate,
    },
  } as unknown as MomoRuntime
}

function createSiteConfigRecord() {
  return {
    homeSections: [
      {
        id: 'writing',
        order: 0,
        type: 'writing',
        visible: true,
      },
    ],
    navigation: [
      {
        href: '/writing',
        id: 'writing',
        label: '文章',
        order: 0,
        visible: true,
      },
    ],
    seo: {
      description: '站点描述',
      title: 'XDD',
    },
    siteKey: 'bobo',
    updatedAt: new Date('2026-07-02T08:00:00.000Z'),
  }
}
