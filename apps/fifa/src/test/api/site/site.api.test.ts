import type { ApiResponse, SiteConfigResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  getConfig: vi.fn(),
  updateConfig: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      site: {
        config: {
          $get: rpcMocks.getConfig,
          $patch: rpcMocks.updateConfig,
        },
      },
    },
  },
}))

describe('site api 封装', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取站点配置时调用 /rpc/site/config', async () => {
    const responseBody: ApiResponse<SiteConfigResponse> = {
      ok: true,
      data: {
        site: {
          homeSections: [],
          navigation: [],
          seo: {
            description: null,
            title: 'XDD',
          },
          siteKey: 'bobo',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.getConfig.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { getSiteConfig } = await import('@fifa/api/site/site.api')

    await expect(getSiteConfig()).resolves.toEqual(responseBody)
  })

  it('保存站点配置时传入请求体', async () => {
    const payload = {
      seo: {
        description: '个人站',
        title: 'XDD',
      },
    }
    const responseBody: ApiResponse<SiteConfigResponse> = {
      ok: true,
      data: {
        site: {
          homeSections: [],
          navigation: [],
          seo: payload.seo,
          siteKey: 'bobo',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.updateConfig.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { updateSiteConfig } = await import('@fifa/api/site/site.api')

    await expect(updateSiteConfig(payload)).resolves.toEqual(responseBody)
    expect(rpcMocks.updateConfig).toHaveBeenCalledWith({
      json: payload,
    })
  })
})
