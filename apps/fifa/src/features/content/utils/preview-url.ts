import { fifaEnv } from '@fifa/api/client'

export function buildBoboPreviewUrl(
  targetType: 'post' | 'project',
  targetId: string,
  token: string,
  baseUrlValue = fifaEnv.VITE_BOBO_BASE_URL,
) {
  const baseUrl = baseUrlValue.replace(/\/+$/, '')
  const url = new URL(`${baseUrl}/preview/${targetType}/${targetId}`)
  url.searchParams.set('token', token)

  return url.toString()
}

export function buildBoboTargetPreviewUrl(
  targetType: 'projects',
  targetId: string,
  token: string,
  baseUrlValue = fifaEnv.VITE_BOBO_BASE_URL,
) {
  return buildBoboPreviewUrl(targetType === 'projects' ? 'project' : targetType, targetId, token, baseUrlValue)
}
