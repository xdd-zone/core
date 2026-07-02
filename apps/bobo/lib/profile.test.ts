import { BizCode } from '@xdd-zone/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPublicProfile: vi.fn(),
}))

vi.mock('@/lib/api/profile.api', () => ({
  getPublicProfile: mocks.getPublicProfile,
}))

describe('profile domain', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取公开档案成功时返回 profile', async () => {
    const { getPublicProfile } = await import('./profile')

    mocks.getPublicProfile.mockResolvedValue({
      data: {
        profile: {
          availableForWork: true,
          avatarAssetId: null,
          bio: '写代码和记录。',
          contactEmail: 'hi@example.com',
          displayName: '喜东东',
          location: 'Shanghai',
          socialLinks: [{ href: 'https://example.com', label: 'Example' }],
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
      },
      meta: { requestId: 'request-1', timestamp: '2026-06-01T00:00:00.000Z' },
      ok: true,
    })

    await expect(getPublicProfile()).resolves.toMatchObject({
      bio: '写代码和记录。',
      contactEmail: 'hi@example.com',
      displayName: '喜东东',
    })
  })

  it('momo 返回错误时抛出错误信息', async () => {
    const { getPublicProfile } = await import('./profile')

    mocks.getPublicProfile.mockResolvedValue({
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: 'profile failed',
      },
      meta: { requestId: 'request-2', timestamp: '2026-06-01T00:00:00.000Z' },
      ok: false,
    })

    await expect(getPublicProfile()).rejects.toMatchObject({
      code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
      message: 'profile failed',
      reason: 'request-failed',
    })
  })
})
