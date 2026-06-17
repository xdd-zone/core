import { fifaEnv } from '@fifa/api/client'

export function buildBoboPreviewUrl(postId: string, token: string, baseUrlValue = fifaEnv.VITE_BOBO_BASE_URL) {
  const baseUrl = baseUrlValue.replace(/\/+$/, '')
  const url = new URL(`${baseUrl}/preview/posts/${postId}`)
  url.searchParams.set('token', token)

  return url.toString()
}
