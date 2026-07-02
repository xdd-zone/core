import type { ApiResponse, PublicProfileResponse } from '@xdd-zone/contracts'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

const rpcMocks = vi.hoisted(() => ({
  updatePublicProfile: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      profile: {
        public: {
          $patch: rpcMocks.updatePublicProfile,
        },
      },
    },
  },
}))

vi.mock('@fifa/api/momo-url', () => ({
  resolveMomoHttpUrl: (path: string) => new URL(`https://momo.test${path}`),
}))

describe('public profile api 封装', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取公开资料时调用 /rpc/profile/public', async () => {
    const responseBody: ApiResponse<PublicProfileResponse> = {
      ok: true,
      data: {
        profile: {
          availableForWork: false,
          avatarAssetId: null,
          bio: null,
          contactEmail: null,
          displayName: '喜东东',
          location: null,
          socialLinks: [],
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(responseBody), { status: 200 }))
    const { getPublicProfile } = await import('@fifa/api/profile/profile.api')

    await expect(getPublicProfile()).resolves.toEqual(responseBody)
    expect(fetchMock).toHaveBeenCalledWith(new URL('https://momo.test/rpc/profile/public'), {
      credentials: 'include',
    })
  })

  it('保存公开资料时传入请求体', async () => {
    const payload = {
      availableForWork: true,
      avatarAssetId: null,
      bio: '写代码',
      contactEmail: 'hi@example.com',
      displayName: '喜东东',
      location: 'Shanghai',
      socialLinks: [],
    }
    const responseBody: ApiResponse<PublicProfileResponse> = {
      ok: true,
      data: {
        profile: {
          availableForWork: true,
          avatarAssetId: null,
          bio: '写代码',
          contactEmail: 'hi@example.com',
          displayName: '喜东东',
          location: 'Shanghai',
          socialLinks: [],
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(responseBody), { status: 200 }))
    const { updatePublicProfile } = await import('@fifa/api/profile/profile.api')

    await expect(updatePublicProfile(payload)).resolves.toEqual(responseBody)
    expect(fetchMock).toHaveBeenCalledWith(new URL('https://momo.test/rpc/profile/public'), {
      body: JSON.stringify(payload),
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })
  })
})
