import { fifaEnv } from '@fifa/api/client'

export function buildBoboPreviewUrl(postId: string, token: string) {
  const baseUrl = fifaEnv.VITE_BOBO_BASE_URL.replace(/\/+$/, '')
  const url = new URL(`/preview/posts/${postId}`, baseUrl)
  url.searchParams.set('token', token)

  return url.toString()
}
