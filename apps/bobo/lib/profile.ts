import type { PublicProfile } from '@xdd-zone/contracts'
import { PublicProfileResponseSchema } from '@xdd-zone/contracts'
import { getPublicProfile as requestPublicProfile } from '@/lib/api/profile.api'
import { assertPublicCmsData, PublicCmsError } from '@/lib/public-cms-error'

export const FALLBACK_PUBLIC_PROFILE = {
  availableForWork: false,
  avatarAssetId: null,
  bio: '我做 Web 产品、Agent 工具和内容系统。这里放近期文章、代表作品、碎碎念，以及一些正在打磨的技术实验。',
  contactEmail: 'hi@xidongdong.dev',
  displayName: '喜东东',
  location: null,
  socialLinks: [
    {
      href: 'https://github.com/xdd-zone/core',
      label: 'GitHub',
    },
  ],
  updatedAt: '2026-06-01T00:00:00.000Z',
} satisfies PublicProfile

export async function getPublicProfile(): Promise<PublicProfile> {
  const body = await requestPublicProfile()

  if (!body.ok) {
    throw new PublicCmsError('request-failed', body.error.message || 'Momo 公开档案接口暂时不可用。', body.error.code)
  }

  return assertPublicCmsData(body.data, PublicProfileResponseSchema, 'Momo 返回的公开档案格式不正确。').profile
}

export async function getPublicProfileOrFallback(): Promise<PublicProfile> {
  try {
    return await getPublicProfile()
  } catch {
    return FALLBACK_PUBLIC_PROFILE
  }
}
