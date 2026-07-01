import type {
  FifaProfileResponse,
  UpdateFifaProfileRequest,
  UploadFifaProfileAvatarResponse,
} from '@xdd-zone/contracts'
import { momoClient } from '@fifa/api/client'
import { resolveMomoHttpUrl } from '@fifa/api/momo-url'
import { readMomoJson } from '@fifa/api/rpc'

interface BetterAuthLinkSocialResponse {
  url?: string
}

export class LinkFifaProfileSocialError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LinkFifaProfileSocialError'
  }
}

export function getFifaProfile() {
  return readMomoJson<FifaProfileResponse>(momoClient.rpc.fifa.profile.$get())
}

export function updateFifaProfile(payload: UpdateFifaProfileRequest) {
  return readMomoJson<FifaProfileResponse>(
    momoClient.rpc.fifa.profile.$patch({
      json: payload,
    }),
  )
}

export function uploadFifaProfileAvatar(file: File) {
  return readMomoJson<UploadFifaProfileAvatarResponse>(
    momoClient.rpc.fifa.profile.avatar.$post({
      form: {
        file,
      },
    }),
  )
}

export async function linkFifaProfileSocial(provider: 'github' | 'google', callbackURL: string) {
  let response: Response

  try {
    response = await fetch(resolveMomoHttpUrl('/api/auth/link-social'), {
      body: JSON.stringify({
        callbackURL,
        provider,
      }),
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
  } catch {
    throw new LinkFifaProfileSocialError('Momo 账号绑定请求失败')
  }

  if (!response.ok) {
    throw new LinkFifaProfileSocialError(await resolveBetterAuthErrorMessage(response))
  }

  return (await response.json()) as BetterAuthLinkSocialResponse
}

async function resolveBetterAuthErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown }

    if (typeof body.message === 'string' && body.message.trim() !== '') {
      return body.message
    }
  } catch {
    // Better Auth 有些失败响应不是 JSON。
  }

  return `账号绑定失败: ${response.status}`
}
